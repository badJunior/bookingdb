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
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Courier> Couriers { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<BikeInspection> BikeInspections { get; set; }
        public DbSet<InspectionPhoto> InspectionPhotos { get; set; }

        public BikesBookingDbContext(DbContextOptions<BikesBookingDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Role).HasConversion<string>();
                entity.HasIndex(u => u.Email);
            });

            modelBuilder.Entity<Courier>(entity =>
            {
                entity.HasOne(c => c.User)
                    .WithOne(u => u.Courier)
                    .HasForeignKey<Courier>(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(c => c.Phone).IsUnique();
                entity.Property(c => c.RowVersion).IsRowVersion();
            });

            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasOne(b => b.User)
                    .WithMany()
                    .HasForeignKey(b => b.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Delivery>(entity =>
            {
                entity.HasOne(d => d.Booking)
                    .WithMany(b => b.Deliveries)
                    .HasForeignKey(d => d.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Courier)
                    .WithMany()
                    .HasForeignKey(d => d.CourierId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(d => d.RowVersion).IsRowVersion();

                // A courier can carry only one active delivery at a time.
                entity.HasIndex(d => d.CourierId)
                    .IsUnique()
                    .HasFilter("\"Status\" IN (1, 2, 3)");
            });

            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.Receipts)
                    .HasForeignKey(r => r.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Payment)
                    .WithMany()
                    .HasForeignKey(r => r.PaymentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(r => r.PaymentId).IsUnique();
            });

            modelBuilder.Entity<BikeInspection>(entity =>
            {
                entity.HasOne(i => i.Booking)
                    .WithMany(b => b.Inspections)
                    .HasForeignKey(i => i.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(i => new { i.BookingId, i.Phase }).IsUnique();
            });

            modelBuilder.Entity<InspectionPhoto>(entity =>
            {
                entity.HasOne(p => p.Inspection)
                    .WithMany(i => i.Photos)
                    .HasForeignKey(p => p.InspectionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
