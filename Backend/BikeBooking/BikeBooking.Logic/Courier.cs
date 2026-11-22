namespace BikeBooking.Logic
{
    public enum CourierStatus
    {
        Offline = 0,
        Available = 1,
        Busy = 2
    }

    public class Courier
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public string Phone { get; set; } = string.Empty;

        public bool IsApproved { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public CourierStatus Status { get; set; } = CourierStatus.Offline;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime? LastLocationAt { get; set; }

        // PostgreSQL xmin system column, used for optimistic concurrency.
        public uint RowVersion { get; set; }
    }
}
