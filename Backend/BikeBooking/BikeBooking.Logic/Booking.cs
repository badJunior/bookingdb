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

        public int? UserId { get; set; }
        public User? User { get; set; }

        public decimal TotalPrice { get; set; }
        public decimal DeliveryFee { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Created;
        public DateTime? HandedOverAt { get; set; }
        public DateTime? ReturnedAt { get; set; }

        public Bike Bike { get; set; } = null!;

        public Payment? Payment { get; set; }

        public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

        public ICollection<BikeInspection> Inspections { get; set; } = new List<BikeInspection>();

        public ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    }
}
