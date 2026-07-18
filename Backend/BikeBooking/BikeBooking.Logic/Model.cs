namespace BikeBooking.Logic
{
    public class Model
    {
        public int Id { get; set; }
        public int Power { get; set; }

        public int StartYear { get; set; }
        public int? EndYear { get; set; }

        public string Name { get; set; }

        public Category Category { get; set; }


    }
}
