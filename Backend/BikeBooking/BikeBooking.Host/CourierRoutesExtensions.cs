using BikeBooking.Logic;
using BikeBooking.Services;

namespace BikeBooking.Host
{
    public static class CourierRoutesExtensions
    {
        public static void RegisterCourierRoutes(this WebApplication app)
        {
            app.MapPost("/auth/register/courier", async (RegisterCourierRequest request, ICourierService courierService) =>
            {
                try
                {
                    var courier = await courierService.Register(new RegisterCourierDto(
                        request.Username,
                        request.Email,
                        request.Phone,
                        request.Password));

                    return Results.Ok(courier);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            }).AllowAnonymous();

            var me = app.MapGroup("/couriers")
                .RequireAuthorization("Courier");

            me.AddEndpointFilter<ApprovedCourierFilter>();

            me.MapGet("/me", async (HttpContext http, ICourierService courierService) =>
            {
                var (userId, _) = HttpUser.Get(http);
                var courier = await courierService.GetMe(userId);
                return courier is null ? Results.NotFound() : Results.Ok(courier);
            });

            me.MapPost("/me/location", async (
                UpdateCourierLocationRequest request,
                HttpContext http,
                ICourierService courierService) =>
            {
                var (userId, _) = HttpUser.Get(http);

                try
                {
                    var courier = await courierService.UpdateLocation(userId, request.Latitude, request.Longitude);
                    return Results.Ok(courier);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            me.MapPost("/me/status", async (
                UpdateCourierStatusRequest request,
                HttpContext http,
                ICourierService courierService) =>
            {
                if (!Enum.TryParse<CourierStatus>(request.Status, true, out var status))
                    return Results.BadRequest(new { error = "Unknown courier status." });

                var (userId, _) = HttpUser.Get(http);

                try
                {
                    var courier = await courierService.UpdateStatus(userId, status);
                    return Results.Ok(courier);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            var admin = app.MapGroup("/couriers")
                .RequireAuthorization("Admin");

            admin.MapGet("/", async (ICourierService courierService) =>
            {
                var couriers = await courierService.GetAll();
                return Results.Ok(couriers);
            });

            admin.MapPost("/{id:int}/approve", async (int id, ICourierService courierService) =>
            {
                try
                {
                    return Results.Ok(await courierService.Approve(id));
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            admin.MapPost("/{id:int}/reject", async (int id, ICourierService courierService) =>
            {
                try
                {
                    await courierService.Reject(id);
                    return Results.NoContent();
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });
        }
    }

    public record RegisterCourierRequest(string Username, string Email, string Phone, string Password);
    public record UpdateCourierLocationRequest(double Latitude, double Longitude);
    public record UpdateCourierStatusRequest(string Status);
}
