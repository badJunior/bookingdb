using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;


namespace BikeBooking.Services
{
    public class BookingServices : IBookingService
    {
        private readonly BikesBookingDbContext _context;


        public BookingServices(BikesBookingDbContext context)
        {
            _context = context;
        }
        async Task<AvailableBikeDto[]> IBookingService.GetAvailableBikes()
        {
            var bikes = await _context.Bikes.Include(b=>b.Model.Category).ToArrayAsync();
            if (bikes == null)
            {
                throw new ArgumentNullException(nameof(bikes));
            }
            var dto = bikes.Select(bike => new AvailableBikeDto(bike.Id, bike.Model.Name, bike.Availability, bike.Year, bike.Model.Category.Name,bike.Model.Power)).ToArray();
            return dto;
        }
    }
}
