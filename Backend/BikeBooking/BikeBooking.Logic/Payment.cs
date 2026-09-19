using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BikeBooking.Logic
{
    public class Payment
    {
        public int Id { get; set; }

        public int BookingId { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public string PaymentType { get; set; } = string.Empty;

        public decimal Amount { get; set; }
        public Booking Booking { get; set; } = null!;
        public string? StripePaymentIntentId { get; set; }
    }
}
