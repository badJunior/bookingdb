using BikeBooking.Logic;

namespace BikeBooking.Services
{
    public interface IDeliveryService
    {
        DeliveryFeeDto CalculateFee(double latitude, double longitude);

        Task<DeliveryDto[]> GetDeliveries(int userId, UserRole role);

        Task<DeliveryDto?> GetDelivery(int deliveryId, int userId, UserRole role);

        Task<DeliveryDto> UpdateStatus(int deliveryId, int userId, UserRole role, DeliveryStatus newStatus);

        Task<DeliveryDto> Assign(int deliveryId, int courierId, UserRole role);

        Task<bool> TryAssign(int deliveryId);

        Task TryAssignDueForBooking(int bookingId);
    }

    public record DeliveryFeeDto(
        double DistanceKm,
        decimal Fee,
        decimal BaseFee,
        decimal PerKmRate,
        bool WithinRange
    );

    public record DeliveryDto(
        int Id,
        int BookingId,
        int? CourierId,
        string CourierName,
        string CourierPhone,
        string Kind,
        string Status,
        string AddressLine,
        double Latitude,
        double Longitude,
        DateTime ScheduledFrom,
        DateTime ScheduledTo,
        double DistanceKm,
        decimal Fee,
        int BikeId,
        string BikeModel,
        string ClientName,
        DateTime CreatedAt,
        DateTime? AssignedAt,
        DateTime? CompletedAt
    );
}
