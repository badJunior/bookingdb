using System.Text.Json;
using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;

namespace BikeBooking.Services
{
    /// <summary>
    /// Emulated fiscalization: produces a realistic receipt payload with
    /// fiscal numbers and a QR string, without a real cash register.
    /// </summary>
    public class EmulatedReceiptService : IReceiptService
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly BikesBookingDbContext _context;

        public EmulatedReceiptService(BikesBookingDbContext context)
        {
            _context = context;
        }

        public async Task<ReceiptDto> RegisterForPayment(
            Booking booking,
            Payment payment,
            CancellationToken cancellationToken = default)
        {
            var existing = await _context.Receipts
                .FirstOrDefaultAsync(r => r.PaymentId == payment.Id, cancellationToken);

            if (existing is not null)
                return Map(existing);

            if (booking.Bike is null)
            {
                booking = await _context.Bookings
                    .Include(b => b.Bike).ThenInclude(bike => bike.Model)
                    .FirstAsync(b => b.Id == booking.Id, cancellationToken);
            }

            var receipt = new Receipt
            {
                BookingId = booking.Id,
                PaymentId = payment.Id,
                Amount = payment.Amount,
                Provider = "Emulated"
            };

            Fill(receipt, booking, payment);

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync(cancellationToken);

            return Map(receipt);
        }

        public async Task<ReceiptDto?> GetForBooking(
            int bookingId,
            int userId,
            UserRole role,
            CancellationToken cancellationToken = default)
        {
            var booking = await _context.Bookings
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
                ?? throw new KeyNotFoundException($"Booking {bookingId} was not found.");

            if (role != UserRole.Admin && booking.UserId != userId)
                throw new UnauthorizedAccessException("This booking belongs to another user.");

            var receipt = await _context.Receipts
                .AsNoTracking()
                .Where(r => r.BookingId == bookingId)
                .OrderByDescending(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return receipt is null ? null : Map(receipt);
        }

        public async Task<ReceiptDto> Retry(
            int receiptId,
            UserRole role,
            CancellationToken cancellationToken = default)
        {
            if (role != UserRole.Admin)
                throw new UnauthorizedAccessException("Only an admin can retry fiscalization.");

            var receipt = await _context.Receipts
                .Include(r => r.Booking).ThenInclude(b => b.Bike).ThenInclude(bike => bike.Model)
                .Include(r => r.Payment)
                .FirstOrDefaultAsync(r => r.Id == receiptId, cancellationToken)
                ?? throw new KeyNotFoundException($"Receipt {receiptId} was not found.");

            Fill(receipt, receipt.Booking, receipt.Payment);
            await _context.SaveChangesAsync(cancellationToken);

            return Map(receipt);
        }

        private static void Fill(Receipt receipt, Booking booking, Payment payment)
        {
            var now = DateTime.UtcNow;
            var hours = Math.Max(1m, (decimal)(booking.EndDate - booking.StartDate).TotalHours);
            var rental = booking.TotalPrice - booking.DeliveryFee;
            if (rental <= 0)
                rental = booking.TotalPrice;

            var modelName = booking.Bike?.Model?.Name ?? "Мотоцикл";
            var items = new List<ReceiptItemDto>
            {
                new(
                    $"Аренда мотоцикла {modelName}",
                    Math.Round(hours, 0),
                    Math.Round(rental / hours, 2),
                    Math.Round(rental, 2))
            };

            if (booking.DeliveryFee > 0)
            {
                items.Add(new ReceiptItemDto(
                    "Доставка и забор мотоцикла",
                    1,
                    booking.DeliveryFee,
                    booking.DeliveryFee));
            }

            receipt.Amount = payment.Amount;
            receipt.Status = ReceiptStatus.Registered;
            receipt.Provider = "Emulated";
            receipt.FiscalDriveNumber = Digits(16);
            receipt.FiscalDocumentNumber = Digits(10);
            receipt.FiscalSign = Digits(10);
            receipt.RegisteredAt = now;
            receipt.CreatedAt = receipt.CreatedAt == default ? now : receipt.CreatedAt;
            receipt.Error = null;
            receipt.ItemsJson = JsonSerializer.Serialize(items, JsonOptions);
            receipt.QrPayload =
                $"t={now:yyyyMMddTHHmm}&s={payment.Amount:0.00}&fn={receipt.FiscalDriveNumber}" +
                $"&i={receipt.FiscalDocumentNumber}&fp={receipt.FiscalSign}&n=1";
        }

        private static string Digits(int length) =>
            string.Concat(Enumerable.Range(0, length).Select(_ => Random.Shared.Next(0, 10)));

        private static ReceiptDto Map(Receipt receipt)
        {
            var items = string.IsNullOrWhiteSpace(receipt.ItemsJson)
                ? []
                : JsonSerializer.Deserialize<ReceiptItemDto[]>(receipt.ItemsJson, JsonOptions) ?? [];

            return new ReceiptDto(
                receipt.Id,
                receipt.BookingId,
                receipt.Status.ToString(),
                receipt.Provider,
                receipt.Amount,
                receipt.FiscalDriveNumber,
                receipt.FiscalDocumentNumber,
                receipt.FiscalSign,
                receipt.QrPayload,
                receipt.Error,
                receipt.CreatedAt,
                receipt.RegisteredAt,
                items);
        }
    }
}
