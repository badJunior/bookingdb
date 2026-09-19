using System.Text.Json.Serialization;

namespace BikeBooking.Services
{
    public interface IBookingService
    {
        Task<AvailableBikeDto[]> GetAvailableBikes(DateTime? startDate = null, DateTime? endDate = null);
        Task<CreateBookingResponseDto> CreateBooking(CreateBookingServiceDto createBookingServiceDto);
    }

    public record AvailableBikeDto(
        int id,
        string model,
        bool availability,
        int year,
        string category,
        int power,
        int price
    );

    public record CreateBookingServiceDto(
        int BikeId,
        DateTime StartDate,
        DateTime EndDate,
        string ClientName,
        string PaymentType,
        string? StripePaymentIntentId
    );

    public record CreateBookingResponseDto(
        int Id,
        int BikeId,
        DateTime StartDate,
        DateTime EndDate,
        string ClientName,
        decimal TotalPrice,
        DateTime PaymentDate,
        string PaymentType
    );
}