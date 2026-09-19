using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BikeBooking.Logic
{
    public class Booking
    {
        public int Id { get; set; }
        public int BikeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string ClientName { get; set; } = string.Empty;

        public Bike Bike { get; set; } = null!;

        public Payment? Payment { get; set; }
    }
}
