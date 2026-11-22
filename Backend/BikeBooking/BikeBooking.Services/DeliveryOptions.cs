namespace BikeBooking.Services
{
    public class DeliveryOptions
    {
        // Pickup point: Omsk, Volochaevskaya 17
        public double ShopLatitude { get; set; } = 54.9974705;
        public double ShopLongitude { get; set; } = 73.3543775;

        // Omsk center, used by the map UI as the default view
        public double MapCenterLatitude { get; set; } = 54.9885;
        public double MapCenterLongitude { get; set; } = 73.3242;

        public decimal BaseFee { get; set; } = 300m;
        public decimal PerKmRate { get; set; } = 50m;
        public double MaxDistanceKm { get; set; } = 30d;

        // Do not hold a courier for a delivery that is far in the future.
        public int AssignmentLeadMinutes { get; set; } = 60;
        public int AssignmentRetrySeconds { get; set; } = 30;
        public int LocationFreshnessMinutes { get; set; } = 5;
        public int CourierOfflineMinutes { get; set; } = 10;
        public int PickupWindowHours { get; set; } = 2;
    }
}
