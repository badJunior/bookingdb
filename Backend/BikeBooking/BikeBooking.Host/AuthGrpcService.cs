using BikeBooking.Host.Protos;
using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Grpc.Core;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Paket;

namespace BikeBooking.Host.Services
{
    public class AuthGrpcService : Protos.AuthService.AuthServiceBase
    {
        private readonly BikesBookingDbContext _context;

        public AuthGrpcService(BikesBookingDbContext context)
        {
            _context = context;
        }

        public override async Task<RegisterResponse> Register(Protos.RegisterRequest request, ServerCallContext context = null)
        {
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new RegisterResponse
            {
                UserId = user.Id,
                Message = "Регистрация успешна!"
            };
        }
    }
}