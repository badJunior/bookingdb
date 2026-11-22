namespace BikeBooking.Services
{
    public class StorageOptions
    {
        public string Root { get; set; } = "uploads";
        public long MaxFileBytes { get; set; } = 10 * 1024 * 1024;
        public int MaxPhotosPerPhase { get; set; } = 12;
        public int MinPhotosPerPhase { get; set; } = 4;
    }
}
