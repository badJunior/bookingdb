using System.Security.Claims;
using BikeBooking.Logic;

namespace BikeBooking.Host
{
    public static class HttpUser
    {
        public static (int UserId, UserRole Role) Get(HttpContext context)
        {
            var idClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var roleClaim = context.User.FindFirstValue(ClaimTypes.Role);

            var userId = int.TryParse(idClaim, out var id) ? id : 0;
            var role = Enum.TryParse<UserRole>(roleClaim, true, out var parsed) ? parsed : UserRole.User;

            return (userId, role);
        }
    }

    public static class ApiResults
    {
        public static IResult FromException(Exception exception) => exception switch
        {
            KeyNotFoundException => Results.NotFound(new { error = exception.Message }),
            UnauthorizedAccessException => Results.Json(
                new { error = exception.Message },
                statusCode: StatusCodes.Status403Forbidden),
            ArgumentException => Results.BadRequest(new { error = exception.Message }),
            InvalidOperationException => Results.BadRequest(new { error = exception.Message }),
            _ => Results.Problem(exception.Message)
        };
    }
}
