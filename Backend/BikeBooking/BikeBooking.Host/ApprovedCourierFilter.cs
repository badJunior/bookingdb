using BikeBooking.Services;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;

namespace BikeBooking.Host
{
    /// <summary>
    /// Allows courier endpoints only for couriers approved by an admin.
    /// </summary>
    public sealed class ApprovedCourierFilter : IEndpointFilter
    {
        public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
        {
            var http = context.HttpContext;
            var (userId, _) = HttpUser.Get(http);

            if (userId == 0)
                return Results.Unauthorized();

            var db = http.RequestServices.GetRequiredService<BikesBookingDbContext>();

            var approved = await db.Couriers.AnyAsync(c => c.UserId == userId && c.IsApproved);

            if (!approved)
            {
                return Results.Json(
                    new { error = "Courier account is not approved yet." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            return await next(context);
        }
    }
}
