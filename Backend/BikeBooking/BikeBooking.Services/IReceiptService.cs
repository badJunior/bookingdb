using BikeBooking.Logic;

namespace BikeBooking.Services
{
    public interface IReceiptService
    {
        Task<ReceiptDto> RegisterForPayment(Booking booking, Payment payment, CancellationToken cancellationToken = default);

        Task<ReceiptDto?> GetForBooking(int bookingId, int userId, UserRole role, CancellationToken cancellationToken = default);

        Task<ReceiptDto> Retry(int receiptId, UserRole role, CancellationToken cancellationToken = default);
    }

    public record ReceiptItemDto(string Name, decimal Quantity, decimal Price, decimal Sum);

    public record ReceiptDto(
        int Id,
        int BookingId,
        string Status,
        string Provider,
        decimal Amount,
        string? FiscalDriveNumber,
        string? FiscalDocumentNumber,
        string? FiscalSign,
        string? QrPayload,
        string? Error,
        DateTime CreatedAt,
        DateTime? RegisteredAt,
        ReceiptItemDto[] Items
    );
}
