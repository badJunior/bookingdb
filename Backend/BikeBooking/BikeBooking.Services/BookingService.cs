using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace BikeBooking.Services
{
    public class BookingServices : IBookingService
    {
        private readonly BikesBookingDbContext _context;
   

        public BookingServices(BikesBookingDbContext context)
        {
            _context = context;
            
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

            // 4. Превращаем в DTO
            return bikes.Select(bike => new AvailableBikeDto(
                bike.Id,
                bike.Model.Name,
                true, 
                bike.Year,
                bike.Model.Category.Name,
                bike.Model.Power,
                bike.Price
            )).ToArray();
        }

        public async Task<CreateBookingResponseDto> CreateBooking(CreateBookingServiceDto request)
        {
            
            var bike = await _context.Bikes
                .Include(b => b.Model)
                .FirstOrDefaultAsync(b => b.Id == request.BikeId);
           
            if (bike == null)
                throw new ArgumentException($"Байк с ID {request.BikeId} не найден");
           

            var isBooked = await _context.Bookings
                .AnyAsync(b => b.BikeId == request.BikeId &&
                               request.StartDate <= b.EndDate &&
                               request.EndDate >= b.StartDate);

            if (isBooked)
                throw new InvalidOperationException("Этот байк уже забронирован на выбранное время!");

            var newBooking = new Booking
            {
                BikeId = request.BikeId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ClientName = request.ClientName
            };
            _context.Bookings.Add(newBooking);

            
            var durationHours = (decimal)(request.EndDate - request.StartDate).TotalHours;
            var totalPrice = bike.Price * durationHours;

         
            var newPayment = new Payment
            {
                Booking = newBooking,
                PaymentDate = DateTime.UtcNow,
                PaymentType = request.PaymentType,
                Amount = totalPrice,
                StripePaymentIntentId = request.StripePaymentIntentId
            };
         
            _context.Payments.Add(newPayment);

          
            await _context.SaveChangesAsync();

            return new CreateBookingResponseDto(
                newBooking.Id,
                newBooking.BikeId,
                newBooking.StartDate,
                newBooking.EndDate,
                newBooking.ClientName,
                totalPrice,
                newPayment.PaymentDate,
                newPayment.PaymentType
            );
        }

    }
}
