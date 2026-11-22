namespace BikeBooking.Logic
{
    public class Bike
    {
        public int Id { get; set; }
        public Model Model { get; set; }
        
        public int Year { get; set; }

        public int Price { get; set; }
        public string? ImageUrl { get; set; }
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    }
}
