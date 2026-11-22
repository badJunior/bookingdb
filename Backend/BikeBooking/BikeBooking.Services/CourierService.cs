using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;

namespace BikeBooking.Services
{
    public class CourierService : ICourierService
    {
        private readonly BikesBookingDbContext _context;

        public CourierService(BikesBookingDbContext context)
        {
            _context = context;
        }

        public async Task<CourierDto> Register(RegisterCourierDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username)
                || string.IsNullOrWhiteSpace(request.Email)
                || string.IsNullOrWhiteSpace(request.Phone)
                || string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("Username, email, phone and password are required.");
            }

            if (request.Password.Length < 6)
                throw new ArgumentException("Password must be at least 6 characters long.");

            var email = request.Email.Trim();
            var phone = request.Phone.Trim();

            if (await _context.Users.AnyAsync(u => u.Email == email))
                throw new InvalidOperationException("A user with this email already exists.");

            if (await _context.Couriers.AnyAsync(c => c.Phone == phone))
                throw new InvalidOperationException("A courier with this phone already exists.");

            var user = new User
            {
                Username = request.Username.Trim(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = UserRole.Courier
            };

            var courier = new Courier
            {
                User = user,
                Phone = phone,
                IsApproved = false,
                Status = CourierStatus.Offline
            };

            _context.Couriers.Add(courier);
            await _context.SaveChangesAsync();

            return Map(courier);
        }

        public async Task<CourierDto[]> GetAll()
        {
            var couriers = await _context.Couriers
                .AsNoTracking()
                .Include(c => c.User)
                .OrderBy(c => c.IsApproved)
                .ThenBy(c => c.Id)
                .ToArrayAsync();

            return couriers.Select(Map).ToArray();
        }

        public async Task<CourierDto> Approve(int courierId)
        {
            var courier = await _context.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == courierId)
                ?? throw new KeyNotFoundException($"Courier {courierId} was not found.");

            if (!courier.IsApproved)
            {
                courier.IsApproved = true;
                courier.ApprovedAt = DateTime.UtcNow;
                courier.User.Role = UserRole.Courier;
                await _context.SaveChangesAsync();
            }

            return Map(courier);
        }

        public async Task Reject(int courierId)
        {
            var courier = await _context.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == courierId)
                ?? throw new KeyNotFoundException($"Courier {courierId} was not found.");

            var hasActive = await _context.Deliveries.AnyAsync(d =>
                d.CourierId == courierId
                && (d.Status == DeliveryStatus.Assigned
                    || d.Status == DeliveryStatus.EnRoute
                    || d.Status == DeliveryStatus.Arrived));

            if (hasActive)
                throw new InvalidOperationException("Courier has an active delivery and cannot be rejected.");

            courier.User.Role = UserRole.User;
            _context.Couriers.Remove(courier);
            await _context.SaveChangesAsync();
        }

        public async Task<CourierDto> UpdateLocation(int userId, double latitude, double longitude)
        {
            var courier = await _context.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Courier profile was not found.");

            if (!courier.IsApproved)
                throw new UnauthorizedAccessException("Courier account is not approved yet.");

            if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
                throw new ArgumentException("Invalid coordinates.");

            courier.Latitude = latitude;
            courier.Longitude = longitude;
            courier.LastLocationAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Map(courier);
        }

        public async Task<CourierDto> UpdateStatus(int userId, CourierStatus status)
        {
            if (status is not (CourierStatus.Available or CourierStatus.Offline))
                throw new ArgumentException("Courier can switch only between Available and Offline.");

            var courier = await _context.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Courier profile was not found.");

            if (!courier.IsApproved)
                throw new UnauthorizedAccessException("Courier account is not approved yet.");

            if (status == CourierStatus.Offline)
            {
                var hasActive = await _context.Deliveries.AnyAsync(d =>
                    d.CourierId == courier.Id
                    && (d.Status == DeliveryStatus.Assigned
                        || d.Status == DeliveryStatus.EnRoute
                        || d.Status == DeliveryStatus.Arrived));

                if (hasActive)
                    throw new InvalidOperationException("Finish the current delivery before going offline.");
            }

            courier.Status = status;
            await _context.SaveChangesAsync();

            return Map(courier);
        }

        public async Task<CourierDto?> GetMe(int userId)
        {
            var courier = await _context.Couriers
                .AsNoTracking()
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            return courier is null ? null : Map(courier);
        }

        public Task<bool> IsApproved(int userId) =>
            _context.Couriers.AnyAsync(c => c.UserId == userId && c.IsApproved);

        private static CourierDto Map(Courier courier) => new(
            courier.Id,
            courier.UserId,
            courier.User.Username,
            courier.User.Email,
            courier.Phone,
            courier.IsApproved,
            courier.Status.ToString(),
            courier.Latitude,
            courier.Longitude,
            courier.LastLocationAt);
    }
}
