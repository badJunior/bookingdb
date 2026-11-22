using BikeBooking.Logic;
using BikeBooking.Services;

namespace BikeBooking.Host
{
    public static class DeliveryRoutesExtensions
    {
        public static void RegisterDeliveryRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/deliveries")
                .RequireAuthorization("Authenticated");

            group.MapGet("/", async (
                HttpContext http,
                IDeliveryService deliveryService,
                ICourierService courierService) =>
            {
                var (userId, role) = HttpUser.Get(http);

                if (role == UserRole.Courier && !await courierService.IsApproved(userId))
                    return Results.Forbid();

                var deliveries = await deliveryService.GetDeliveries(userId, role);
                return Results.Ok(deliveries);
            });

            group.MapGet("/options", (Microsoft.Extensions.Options.IOptions<DeliveryOptions> options) =>
            {
                var o = options.Value;

                return Results.Ok(new DeliveryOptionsResponse(
                    o.ShopLatitude,
                    o.ShopLongitude,
                    o.MapCenterLatitude,
                    o.MapCenterLongitude,
                    o.BaseFee,
                    o.PerKmRate,
                    o.MaxDistanceKm,
                    o.PickupWindowHours));
            });

            group.MapGet("/fee-preview", (
                double latitude,
                double longitude,
                IDeliveryService deliveryService) =>
            {
                var fee = deliveryService.CalculateFee(latitude, longitude);
                return Results.Ok(fee);
            });

            group.MapGet("/{id:int}", async (
                int id,
                HttpContext http,
                IDeliveryService deliveryService,
                ICourierService courierService) =>
            {
                var (userId, role) = HttpUser.Get(http);

                if (role == UserRole.Courier && !await courierService.IsApproved(userId))
                    return Results.Forbid();

                try
                {
                    var delivery = await deliveryService.GetDelivery(id, userId, role);
                    return delivery is null ? Results.NotFound() : Results.Ok(delivery);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            group.MapPost("/{id:int}/status", async (
                int id,
                UpdateDeliveryStatusRequest request,
                HttpContext http,
                IDeliveryService deliveryService) =>
            {
                if (!Enum.TryParse<DeliveryStatus>(request.Status, true, out var status))
                    return Results.BadRequest(new { error = "Unknown delivery status." });

                var (userId, role) = HttpUser.Get(http);

                try
                {
                    var delivery = await deliveryService.UpdateStatus(id, userId, role, status);
                    return Results.Ok(delivery);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            group.MapPost("/{id:int}/assign", async (
                int id,
                AssignDeliveryRequest request,
                HttpContext http,
                IDeliveryService deliveryService) =>
            {
                var (_, role) = HttpUser.Get(http);

                try
                {
                    var delivery = await deliveryService.Assign(id, request.CourierId, role);
                    return Results.Ok(delivery);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            }).RequireAuthorization("Admin");
        }
    }

    public record UpdateDeliveryStatusRequest(string Status);
    public record AssignDeliveryRequest(int CourierId);
    public record DeliveryOptionsResponse(
        double ShopLatitude,
        double ShopLongitude,
        double MapCenterLatitude,
        double MapCenterLongitude,
        decimal BaseFee,
        decimal PerKmRate,
        double MaxDistanceKm,
        int PickupWindowHours);
}
