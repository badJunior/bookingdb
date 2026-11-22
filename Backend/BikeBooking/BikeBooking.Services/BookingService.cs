using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;


namespace BikeBooking.Services
{
    public class BookingServices : IBookingService
    {
        private readonly BikesBookingDbContext _context;
        private readonly IDeliveryService _deliveryService;
        private readonly IReceiptService _receiptService;
        private readonly DeliveryOptions _deliveryOptions;
        private readonly ILogger<BookingServices> _logger;

        public BookingServices(
            BikesBookingDbContext context,
            IDeliveryService deliveryService,
            IReceiptService receiptService,
            IOptions<DeliveryOptions> deliveryOptions,
            ILogger<BookingServices> logger)
        {
            _context = context;
            _deliveryService = deliveryService;
            _receiptService = receiptService;
            _deliveryOptions = deliveryOptions.Value;
            _logger = logger;
        }

        public async Task<AvailableBikeDto[]> GetAvailableBikes(DateTime? startDate = null, DateTime? endDate = null)
        {
            var bikesQuery = _context.Bikes
                .Include(b => b.Model)
                .ThenInclude(m => m.Category)
                .Include(b => b.Bookings)
                .AsQueryable();

            if (startDate.HasValue && endDate.HasValue)
            {
                var start = startDate.Value.Date;
                var end = endDate.Value.Date;

                bikesQuery = bikesQuery
                    .Where(b => !b.Bookings.Any(book =>
                        book.StartDate <= end && book.EndDate >= start
                    ));
            }

            var bikes = await bikesQuery.ToArrayAsync();

            return bikes.Select(bike => new AvailableBikeDto(
                bike.Id,
                bike.Model.Name,
                true,
                bike.Year,
                bike.Model.Category.Name,
                bike.Model.Power,
                bike.Price,
                bike.ImageUrl
            )).ToArray();
        }

        public async Task<CreateBookingResponseDto> CreateBooking(CreateBookingServiceDto request)
        {
            if (request.EndDate <= request.StartDate)
                throw new ArgumentException("End date must be later than start date.");

            var bike = await _context.Bikes
                .Include(b => b.Model)
                .FirstOrDefaultAsync(b => b.Id == request.BikeId);

            if (bike == null)
                throw new ArgumentException($"Bike with id {request.BikeId} was not found.");

            var isBooked = await _context.Bookings
                .AnyAsync(b => b.BikeId == request.BikeId &&
                               request.StartDate <= b.EndDate &&
                               request.EndDate >= b.StartDate);

            if (isBooked)
                throw new InvalidOperationException("This bike is already booked for the selected period.");

            var durationHours = (decimal)(request.EndDate - request.StartDate).TotalHours;
            var rentalPrice = Math.Round(bike.Price * durationHours, 2);

            decimal deliveryFee = 0m;
            var deliveries = new List<Delivery>();

            if (request.Delivery is not null)
            {
                var deliveryRequest = request.Delivery;

                if (deliveryRequest.ScheduledFrom >= deliveryRequest.ScheduledTo)
                    throw new ArgumentException("Delivery window is invalid.");

                if (deliveryRequest.ScheduledTo > request.EndDate)
                    throw new ArgumentException("Delivery must happen before the rental ends.");

                if (string.IsNullOrWhiteSpace(deliveryRequest.AddressLine))
                    throw new ArgumentException("Delivery address is required.");

                var fee = _deliveryService.CalculateFee(deliveryRequest.Latitude, deliveryRequest.Longitude);

                if (!fee.WithinRange)
                {
                    throw new InvalidOperationException(
                        $"Delivery distance {fee.DistanceKm:F1} km exceeds the maximum of {_deliveryOptions.MaxDistanceKm:F0} km.");
                }

                deliveryFee = fee.Fee;

                deliveries.Add(new Delivery
                {
                    Kind = DeliveryKind.Dropoff,
                    AddressLine = deliveryRequest.AddressLine.Trim(),
                    Latitude = deliveryRequest.Latitude,
                    Longitude = deliveryRequest.Longitude,
                    ScheduledFrom = deliveryRequest.ScheduledFrom,
                    ScheduledTo = deliveryRequest.ScheduledTo,
                    DistanceKm = fee.DistanceKm,
                    Fee = fee.Fee,
                    Status = DeliveryStatus.Pending
                });

                // The bike is picked up from the same address when the rental ends.
                deliveries.Add(new Delivery
                {
                    Kind = DeliveryKind.Pickup,
                    AddressLine = deliveryRequest.AddressLine.Trim(),
                    Latitude = deliveryRequest.Latitude,
                    Longitude = deliveryRequest.Longitude,
                    ScheduledFrom = request.EndDate,
                    ScheduledTo = request.EndDate.AddHours(_deliveryOptions.PickupWindowHours),
                    DistanceKm = fee.DistanceKm,
                    Fee = 0m,
                    Status = DeliveryStatus.Pending
                });
            }

            var newBooking = new Booking
            {
                BikeId = request.BikeId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ClientName = request.ClientName,
                UserId = request.UserId,
                DeliveryFee = deliveryFee,
                TotalPrice = rentalPrice + deliveryFee,
                Deliveries = deliveries
            };

            _context.Bookings.Add(newBooking);
            await _context.SaveChangesAsync();

            if (string.Equals(request.PaymentType, "Cash", StringComparison.OrdinalIgnoreCase))
            {
                var cashPayment = new Payment
                {
                    BookingId = newBooking.Id,
                    PaymentDate = DateTime.UtcNow,
                    PaymentType = "Cash",
                    Amount = newBooking.TotalPrice
                };

                _context.Payments.Add(cashPayment);
                newBooking.Status = BookingStatus.Paid;
                await _context.SaveChangesAsync();

                try
                {
                    await _receiptService.RegisterForPayment(newBooking, cashPayment);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not fiscalize cash payment for booking {BookingId}", newBooking.Id);
                }
            }

            var dropoff = newBooking.Deliveries.FirstOrDefault(d => d.Kind == DeliveryKind.Dropoff);
            var pickup = newBooking.Deliveries.FirstOrDefault(d => d.Kind == DeliveryKind.Pickup);

            return new CreateBookingResponseDto(
                newBooking.Id,
                newBooking.BikeId,
                newBooking.StartDate,
                newBooking.EndDate,
                newBooking.ClientName,
                rentalPrice,
                deliveryFee,
                newBooking.TotalPrice,
                DateTime.UtcNow,
                request.PaymentType,
                dropoff is null ? null : MapDelivery(dropoff),
                pickup is null ? null : MapDelivery(pickup),
                newBooking.Status.ToString()
            );
        }

        public async Task<BookingListItemDto[]> GetBookings(int userId, UserRole role)
        {
            var query = _context.Bookings
                .AsNoTracking()
                .Include(b => b.Bike).ThenInclude(b => b.Model)
                .Include(b => b.Deliveries)
                .Include(b => b.Inspections).ThenInclude(i => i.Photos)
                .Include(b => b.Receipts)
                .AsQueryable();

            if (role == UserRole.Courier)
            {
                var courierId = await _context.Couriers
                    .Where(c => c.UserId == userId)
                    .Select(c => (int?)c.Id)
                    .FirstOrDefaultAsync();

                if (courierId is null)
                    return [];

                query = query.Where(b => b.Deliveries.Any(d => d.CourierId == courierId));
            }
            else if (role != UserRole.Admin)
            {
                query = query.Where(b => b.UserId == userId);
            }

            var bookings = await query
                .OrderByDescending(b => b.StartDate)
                .ToArrayAsync();

            return bookings.Select(MapBooking).ToArray();
        }

        private static BookingListItemDto MapBooking(Booking booking)
        {
            var receipt = booking.Receipts
                .OrderByDescending(r => r.Id)
                .FirstOrDefault();

            var handover = booking.Inspections
                .FirstOrDefault(i => i.Phase == InspectionPhase.Handover);

            var returnInspection = booking.Inspections
                .FirstOrDefault(i => i.Phase == InspectionPhase.Return);

            var dropoff = booking.Deliveries
                .FirstOrDefault(d => d.Kind == DeliveryKind.Dropoff);

            var pickup = booking.Deliveries
                .FirstOrDefault(d => d.Kind == DeliveryKind.Pickup);

            return new BookingListItemDto(
                booking.Id,
                booking.BikeId,
                booking.Bike?.Model?.Name ?? string.Empty,
                booking.Bike?.ImageUrl,
                booking.StartDate,
                booking.EndDate,
                booking.ClientName,
                booking.TotalPrice - booking.DeliveryFee,
                booking.DeliveryFee,
                booking.TotalPrice,
                booking.Status.ToString(),
                booking.HandedOverAt,
                booking.ReturnedAt,
                receipt is null
                    ? null
                    : new BookingReceiptSummaryDto(
                        receipt.Id,
                        receipt.Status.ToString(),
                        receipt.Amount,
                        receipt.QrPayload,
                        receipt.FiscalDocumentNumber,
                        receipt.RegisteredAt),
                MapInspection(handover),
                MapInspection(returnInspection),
                dropoff is null
                    ? null
                    : new BookingDeliverySummaryDto(
                        dropoff.Id,
                        dropoff.Kind.ToString(),
                        dropoff.Status.ToString(),
                        dropoff.AddressLine,
                        dropoff.ScheduledFrom,
                        dropoff.ScheduledTo),
                pickup is null
                    ? null
                    : new BookingDeliverySummaryDto(
                        pickup.Id,
                        pickup.Kind.ToString(),
                        pickup.Status.ToString(),
                        pickup.AddressLine,
                        pickup.ScheduledFrom,
                        pickup.ScheduledTo));
        }

        private static BookingInspectionSummaryDto? MapInspection(BikeInspection? inspection)
        {
            if (inspection is null)
                return null;

            return new BookingInspectionSummaryDto(
                inspection.Phase.ToString(),
                inspection.Note,
                inspection.CreatedAt,
                inspection.Photos
                    .OrderBy(p => p.SortOrder)
                    .Select(p => new BookingPhotoDto(p.Id, $"/photos/{p.Id}/file"))
                    .ToArray());
        }

        private static CreatedDeliveryDto MapDelivery(Delivery delivery) => new(
            delivery.Id,
            delivery.Kind.ToString(),
            delivery.Status.ToString(),
            delivery.ScheduledFrom,
            delivery.ScheduledTo,
            delivery.DistanceKm,
            delivery.Fee
        );
    }
}
