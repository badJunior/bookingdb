namespace BikeBooking.Services
{
    public interface IGeocodingService
    {
        Task<GeocodeResult[]> Search(string query, CancellationToken cancellationToken = default);
    }

    public record GeocodeResult(string DisplayName, double Latitude, double Longitude);
}
