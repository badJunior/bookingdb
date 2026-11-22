using System.Text.Json.Serialization;
using BikeBooking.Logic;

namespace BikeBooking.Services
{
    public interface IBookingService
    {
        Task<AvailableBikeDto[]> GetAvailableBikes(DateTime? startDate = null, DateTime? endDate = null);
        Task<CreateBookingResponseDto> CreateBooking(CreateBookingServiceDto createBookingServiceDto);
        Task<BookingListItemDto[]> GetBookings(int userId, UserRole role);
    }

    public record AvailableBikeDto(
        int id,
        string model,
        bool availability,
        int year,
        string category,
        int power,
        int price,
        string? imageUrl
    );

    public record CreateBookingServiceDto(
        int BikeId,
        DateTime StartDate,
        DateTime EndDate,
        string ClientName,
        string PaymentType,
        string? StripePaymentIntentId,
        int? UserId = null,
        BookingDeliveryDto? Delivery = null
    );

    public record BookingDeliveryDto(
        string AddressLine,
        double Latitude,
        double Longitude,
        DateTime ScheduledFrom,
        DateTime ScheduledTo
    );

    public record CreatedDeliveryDto(
        int Id,
        string Kind,
        string Status,
        DateTime ScheduledFrom,
        DateTime ScheduledTo,
        double DistanceKm,
        decimal Fee
    );

    public record CreateBookingResponseDto(
        int Id,
        int BikeId,
        DateTime StartDate,
        DateTime EndDate,
        string ClientName,
        decimal RentalPrice,
        decimal DeliveryFee,
        decimal TotalPrice,
        DateTime PaymentDate,
        string PaymentType,
        CreatedDeliveryDto? Dropoff,
        CreatedDeliveryDto? Pickup,
        string Status
    );

    public record BookingReceiptSummaryDto(
        int Id,
        string Status,
        decimal Amount,
        string? QrPayload,
        string? FiscalDocumentNumber,
        DateTime? RegisteredAt
    );

    public record BookingPhotoDto(int Id, string Url);

    public record BookingInspectionSummaryDto(
        string Phase,
        string? Note,
        DateTime CreatedAt,
        BookingPhotoDto[] Photos
    );

    public record BookingDeliverySummaryDto(
        int Id,
        string Kind,
        string Status,
        string AddressLine,
        DateTime ScheduledFrom,
        DateTime ScheduledTo
    );

    public record BookingListItemDto(
        int Id,
        int BikeId,
        string BikeModel,
        string? BikeImageUrl,
        DateTime StartDate,
        DateTime EndDate,
        string ClientName,
        decimal RentalPrice,
        decimal DeliveryFee,
        decimal TotalPrice,
        string Status,
        DateTime? HandedOverAt,
        DateTime? ReturnedAt,
        BookingReceiptSummaryDto? Receipt,
        BookingInspectionSummaryDto? Handover,
        BookingInspectionSummaryDto? Return,
        BookingDeliverySummaryDto? Dropoff,
        BookingDeliverySummaryDto? Pickup
    );
}