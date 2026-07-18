using BikeBooking.Logic;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BikeBooking.Services.persistence
{
    public class BikesBookingDbContext : DbContext
    {
        public DbSet<Bike> Bikes { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Model> Models { get; set; }
        public BikesBookingDbContext(DbContextOptions<BikesBookingDbContext> options) : base(options) { }
    }
}
