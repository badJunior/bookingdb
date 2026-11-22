namespace BikeBooking.Logic
{
    public enum InspectionPhase
    {
        Handover = 0,
        Return = 1
    }

    public class BikeInspection
    {
        public int Id { get; set; }

        public int BookingId { get; set; }
        public Booking Booking { get; set; } = null!;

        public InspectionPhase Phase { get; set; }

        public int CreatedByUserId { get; set; }

        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<InspectionPhoto> Photos { get; set; } = new List<InspectionPhoto>();
    }

    public class InspectionPhoto
    {
        public int Id { get; set; }

        public int InspectionId { get; set; }
        public BikeInspection Inspection { get; set; } = null!;

        public string RelativePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string Sha256 { get; set; } = string.Empty;

        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
