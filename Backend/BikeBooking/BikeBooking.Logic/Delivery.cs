namespace BikeBooking.Logic
{
    public enum DeliveryKind
    {
        Dropoff = 0,
        Pickup = 1
    }

    public enum DeliveryStatus
    {
        Pending = 0,
        Assigned = 1,
        EnRoute = 2,
        Arrived = 3,
        Completed = 4,
        Cancelled = 5,
        Failed = 6
    }

    public class Delivery
    {
        public int Id { get; set; }

        public int BookingId { get; set; }
        public Booking Booking { get; set; } = null!;

        public int? CourierId { get; set; }
        public Courier? Courier { get; set; }

        public DeliveryKind Kind { get; set; }

        public string AddressLine { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public DateTime ScheduledFrom { get; set; }
        public DateTime ScheduledTo { get; set; }

        public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;

        public double DistanceKm { get; set; }
        public decimal Fee { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AssignedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public string? Notes { get; set; }

        // PostgreSQL xmin system column, used for optimistic concurrency.
        public uint RowVersion { get; set; }
    }
}
