namespace BikeBooking.Logic
{
    public enum ReceiptStatus
    {
        Pending = 0,
        Registered = 1,
        Failed = 2,
        Refunded = 3
    }

    public class Receipt
    {
        public int Id { get; set; }

        public int BookingId { get; set; }
        public Booking Booking { get; set; } = null!;

        public int PaymentId { get; set; }
        public Payment Payment { get; set; } = null!;

        public ReceiptStatus Status { get; set; } = ReceiptStatus.Pending;

        public string Provider { get; set; } = "Emulated";
        public decimal Amount { get; set; }

        public string? FiscalDriveNumber { get; set; }
        public string? FiscalDocumentNumber { get; set; }
        public string? FiscalSign { get; set; }
        public string? QrPayload { get; set; }
        public string? ItemsJson { get; set; }
        public string? Error { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RegisteredAt { get; set; }
    }
}
