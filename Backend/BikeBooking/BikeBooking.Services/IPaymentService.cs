namespace BikeBooking.Services
{
    public interface IPaymentService
    {
        Task<CreateEmulatedPaymentResponse> CreateEmulatedPayment(CreateEmulatedPaymentRequest request);
    }

    public record CreateEmulatedPaymentRequest(
        int BookingId,
        decimal TotalPrice
    );

    public record CreateEmulatedPaymentResponse(
        string PaymentId,
        int BookingId
    );
}