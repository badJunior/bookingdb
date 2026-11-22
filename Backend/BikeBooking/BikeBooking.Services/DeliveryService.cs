using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BikeBooking.Services
{
    public class DeliveryService : IDeliveryService
    {
        private static readonly DeliveryStatus[] ActiveStatuses =
        [
            DeliveryStatus.Assigned,
            DeliveryStatus.EnRoute,
            DeliveryStatus.Arrived
        ];

        private static readonly Dictionary<DeliveryStatus, DeliveryStatus[]> CourierTransitions = new()
        {
            [DeliveryStatus.Assigned] = [DeliveryStatus.EnRoute, DeliveryStatus.Cancelled],
            [DeliveryStatus.EnRoute] = [DeliveryStatus.Arrived],
            [DeliveryStatus.Arrived] = [DeliveryStatus.Completed]
        };

        private readonly BikesBookingDbContext _context;
        private readonly DeliveryOptions _options;
        private readonly ILogger<DeliveryService> _logger;

        public DeliveryService(
            BikesBookingDbContext context,
            IOptions<DeliveryOptions> options,
            ILogger<DeliveryService> logger)
        {
            _context = context;
            _options = options.Value;
            _logger = logger;
        }

        public DeliveryFeeDto CalculateFee(double latitude, double longitude)
        {
            var distance = GeoCalculator.HaversineKm(
                _options.ShopLatitude,
                _options.ShopLongitude,
                latitude,
                longitude);

            var withinRange = distance <= _options.MaxDistanceKm;
            var fee = Math.Round(_options.BaseFee + _options.PerKmRate * (decimal)distance, 2);

            return new DeliveryFeeDto(
                Math.Round(distance, 2),
                withinRange ? fee : 0m,
                _options.BaseFee,
                _options.PerKmRate,
                withinRange);
        }

        public async Task<DeliveryDto[]> GetDeliveries(int userId, UserRole role)
        {
            var query = BuildQuery();

            switch (role)
            {
                case UserRole.Admin:
                    break;

                case UserRole.Courier:
                    var courierId = await _context.Couriers
                        .Where(c => c.UserId == userId)
                        .Select(c => (int?)c.Id)
                        .FirstOrDefaultAsync();

                    if (courierId is null)
                        return [];

                    query = query.Where(d => d.CourierId == courierId);
                    break;

                default:
                    query = query.Where(d => d.Booking.UserId == userId);
                    break;
            }

            var deliveries = await query
                .OrderByDescending(d => d.ScheduledFrom)
                .ToArrayAsync();

            return deliveries.Select(Map).ToArray();
        }

        public async Task<DeliveryDto?> GetDelivery(int deliveryId, int userId, UserRole role)
        {
            var delivery = await BuildQuery().FirstOrDefaultAsync(d => d.Id == deliveryId);

            if (delivery is null)
                return null;

            if (role == UserRole.Courier && delivery.CourierId is not null)
            {
                var courierId = await GetCourierId(userId);
                if (delivery.CourierId != courierId)
                    throw new UnauthorizedAccessException("This delivery belongs to another courier.");
            }
            else if (role != UserRole.Admin && delivery.Booking.UserId != userId)
            {
                throw new UnauthorizedAccessException("This delivery belongs to another user.");
            }

            return Map(delivery);
        }

        public async Task<DeliveryDto> UpdateStatus(int deliveryId, int userId, UserRole role, DeliveryStatus newStatus)
        {
            if (newStatus == DeliveryStatus.Pending || newStatus == DeliveryStatus.Assigned)
                throw new InvalidOperationException($"Cannot move delivery to {newStatus} manually.");

            var delivery = await _context.Deliveries
                .Include(d => d.Booking).ThenInclude(b => b.Bike).ThenInclude(b => b.Model)
                .Include(d => d.Courier).ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(d => d.Id == deliveryId)
                ?? throw new KeyNotFoundException($"Delivery {deliveryId} was not found.");

            if (delivery.Status is DeliveryStatus.Completed or DeliveryStatus.Cancelled or DeliveryStatus.Failed)
                throw new InvalidOperationException("Delivery is already finished.");

            if (role == UserRole.Courier)
            {
                var courierId = await GetCourierId(userId)
                    ?? throw new UnauthorizedAccessException("Courier profile was not found.");

                if (delivery.CourierId != courierId)
                    throw new UnauthorizedAccessException("This delivery belongs to another courier.");

                var allowed = CourierTransitions.TryGetValue(delivery.Status, out var next)
                    && next.Contains(newStatus);

                if (!allowed)
                    throw new InvalidOperationException($"Transition {delivery.Status} -> {newStatus} is not allowed.");
            }
            else if (role != UserRole.Admin)
            {
                throw new UnauthorizedAccessException("Only the assigned courier or an admin can change the delivery status.");
            }

            delivery.Status = newStatus;

            if (newStatus is DeliveryStatus.Completed or DeliveryStatus.Cancelled or DeliveryStatus.Failed)
            {
                delivery.CompletedAt = DateTime.UtcNow;
                await ReleaseCourier(delivery.CourierId);
            }

            await SaveWithConcurrencyGuard();
            return Map(delivery);
        }

        public async Task<DeliveryDto> Assign(int deliveryId, int courierId, UserRole role)
        {
            if (role != UserRole.Admin)
                throw new UnauthorizedAccessException("Only an admin can assign deliveries manually.");

            var delivery = await _context.Deliveries
                .Include(d => d.Booking).ThenInclude(b => b.Bike).ThenInclude(b => b.Model)
                .Include(d => d.Courier).ThenInclude(c => c!.User)
                .FirstOrDefaultAsync(d => d.Id == deliveryId)
                ?? throw new KeyNotFoundException($"Delivery {deliveryId} was not found.");

            if (delivery.Status is DeliveryStatus.Completed or DeliveryStatus.Cancelled or DeliveryStatus.Failed)
                throw new InvalidOperationException("Delivery is already finished.");

            var courier = await _context.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == courierId)
                ?? throw new KeyNotFoundException($"Courier {courierId} was not found.");

            if (!courier.IsApproved)
                throw new InvalidOperationException("Courier account is not approved.");

            var alreadyBusy = await _context.Deliveries.AnyAsync(d =>
                d.CourierId == courierId && d.Id != deliveryId && ActiveStatuses.Contains(d.Status));

            if (alreadyBusy)
                throw new InvalidOperationException("Courier already has an active delivery.");

            if (delivery.CourierId is not null && delivery.CourierId != courierId)
                await ReleaseCourier(delivery.CourierId);

            delivery.CourierId = courier.Id;
            delivery.Status = DeliveryStatus.Assigned;
            delivery.AssignedAt = DateTime.UtcNow;
            courier.Status = CourierStatus.Busy;

            await SaveWithConcurrencyGuard();

            delivery.Courier = courier;
            return Map(delivery);
        }

        public async Task<bool> TryAssign(int deliveryId)
        {
            var now = DateTime.UtcNow;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var delivery = await _context.Deliveries
                    .FirstOrDefaultAsync(d => d.Id == deliveryId);

                if (delivery is null || delivery.Status != DeliveryStatus.Pending)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                // Do not hold a courier for a delivery that is far in the future.
                if (delivery.ScheduledFrom > now.AddMinutes(_options.AssignmentLeadMinutes))
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                if (delivery.ScheduledTo < now)
                {
                    delivery.Status = DeliveryStatus.Failed;
                    delivery.CompletedAt = now;
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return false;
                }

                var freshSince = now.AddMinutes(-_options.LocationFreshnessMinutes);

                var busyCourierIds = await _context.Deliveries
                    .Where(d => d.CourierId != null && ActiveStatuses.Contains(d.Status))
                    .Select(d => d.CourierId!.Value)
                    .Distinct()
                    .ToArrayAsync();

                var couriers = await _context.Couriers
                    .Where(c => c.IsApproved
                        && c.Status == CourierStatus.Available
                        && c.LastLocationAt != null
                        && c.LastLocationAt >= freshSince
                        && c.Latitude != null
                        && c.Longitude != null
                        && !busyCourierIds.Contains(c.Id))
                    .ToArrayAsync();

                var best = couriers
                    .Select(c => new
                    {
                        Courier = c,
                        Distance = GeoCalculator.HaversineKm(
                            delivery.Latitude,
                            delivery.Longitude,
                            c.Latitude!.Value,
                            c.Longitude!.Value)
                    })
                    .OrderBy(x => x.Distance)
                    .ThenBy(x => x.Courier.Id)
                    .FirstOrDefault();

                if (best is null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                delivery.CourierId = best.Courier.Id;
                delivery.Status = DeliveryStatus.Assigned;
                delivery.AssignedAt = now;
                best.Courier.Status = CourierStatus.Busy;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Delivery {DeliveryId} assigned to courier {CourierId} ({Distance:F2} km)",
                    delivery.Id, best.Courier.Id, best.Distance);

                return true;
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Failed to assign delivery {DeliveryId}", deliveryId);
                return false;
            }
        }

        public async Task TryAssignDueForBooking(int bookingId)
        {
            var ids = await _context.Deliveries
                .Where(d => d.BookingId == bookingId && d.Status == DeliveryStatus.Pending)
                .Select(d => d.Id)
                .ToArrayAsync();

            foreach (var id in ids)
                await TryAssign(id);
        }

        private IQueryable<Delivery> BuildQuery() =>
            _context.Deliveries
                .AsNoTracking()
                .Include(d => d.Booking).ThenInclude(b => b.Bike).ThenInclude(b => b.Model)
                .Include(d => d.Courier).ThenInclude(c => c!.User);

        private async Task<int?> GetCourierId(int userId) =>
            await _context.Couriers
                .Where(c => c.UserId == userId)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();

        private async Task ReleaseCourier(int? courierId)
        {
            if (courierId is null)
                return;

            var courier = await _context.Couriers.FirstOrDefaultAsync(c => c.Id == courierId);
            if (courier is not null && courier.IsApproved)
                courier.Status = CourierStatus.Available;
        }

        private async Task SaveWithConcurrencyGuard()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                _context.ChangeTracker.Clear();
                throw new InvalidOperationException(
                    "Delivery was changed by another user. Reload and try again.", ex);
            }
        }

        private static DeliveryDto Map(Delivery delivery) => new(
            delivery.Id,
            delivery.BookingId,
            delivery.CourierId,
            delivery.Courier?.User?.Username ?? string.Empty,
            delivery.Courier?.Phone ?? string.Empty,
            delivery.Kind.ToString(),
            delivery.Status.ToString(),
            delivery.AddressLine,
            delivery.Latitude,
            delivery.Longitude,
            delivery.ScheduledFrom,
            delivery.ScheduledTo,
            delivery.DistanceKm,
            delivery.Fee,
            delivery.Booking.BikeId,
            delivery.Booking.Bike?.Model?.Name ?? string.Empty,
            delivery.Booking.ClientName,
            delivery.CreatedAt,
            delivery.AssignedAt,
            delivery.CompletedAt);
    }
}
