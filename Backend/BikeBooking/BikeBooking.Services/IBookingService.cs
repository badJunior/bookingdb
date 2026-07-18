

namespace BikeBooking.Services
{
    public interface IBookingService
    {
        Task<AvailableBikeDto[]> GetAvailableBikes();
        
    }
    public record AvailableBikeDto(int id, string model, bool availability, int year, string category, int power);
}
