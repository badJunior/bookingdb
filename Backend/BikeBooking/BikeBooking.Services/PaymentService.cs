using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BikeBooking.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly BikesBookingDbContext _context;
        private readonly IDeliveryService _deliveryService;
        private readonly IReceiptService _receiptService;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            BikesBookingDbContext context,
            IDeliveryService deliveryService,
            IReceiptService receiptService,
            ILogger<PaymentService> logger)
        {
            _context = context;
            _deliveryService = deliveryService;
            _receiptService = receiptService;
            _logger = logger;
        }

        public async Task<CreateEmulatedPaymentResponse> CreateEmulatedPayment(CreateEmulatedPaymentRequest request)
        {
            var paymentId = "pay_" + Guid.NewGuid().ToString("N");

            var booking = await _context.Bookings
                .Include(b => b.Bike).ThenInclude(bike => bike.Model)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId);

            if (booking == null)
                throw new ArgumentException($"Booking with id {request.BookingId} was not found.");

            var existingPayment = await _context.Payments
                .FirstOrDefaultAsync(p => p.BookingId == request.BookingId);

            if (existingPayment != null)
                throw new InvalidOperationException("This booking is already paid.");

            // Trust the price stored on the booking, not the value sent by the client.
            var amount = booking.TotalPrice > 0 ? booking.TotalPrice : request.TotalPrice;

            var newPayment = new Payment
            {
                BookingId = request.BookingId,
                PaymentDate = DateTime.UtcNow,
                PaymentType = "Card",
                Amount = amount,
                StripePaymentIntentId = paymentId
            };

            _context.Payments.Add(newPayment);
            booking.Status = BookingStatus.Paid;
            await _context.SaveChangesAsync();

            // A fiscalization failure must not break a successful payment.
            try
            {
                await _receiptService.RegisterForPayment(booking, newPayment);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not fiscalize payment {PaymentId} for booking {BookingId}", newPayment.Id, booking.Id);
            }

            // Assignment failure must not break the payment.
            try
            {
                await _deliveryService.TryAssignDueForBooking(booking.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not assign deliveries for booking {BookingId}", booking.Id);
            }

            return new CreateEmulatedPaymentResponse(paymentId, request.BookingId);
        }
    }
}
