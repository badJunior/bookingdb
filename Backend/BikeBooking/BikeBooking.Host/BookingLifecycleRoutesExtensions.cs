using BikeBooking.Logic;
using BikeBooking.Services;

namespace BikeBooking.Host
{
    public static class BookingLifecycleRoutesExtensions
    {
        public static void RegisterBookingLifecycleRoutes(this WebApplication app)
        {
            var group = app.MapGroup("/bookings")
                .RequireAuthorization("Authenticated");

            group.MapGet("/", async (
                HttpContext http,
                IBookingService bookingService) =>
            {
                var (userId, role) = HttpUser.Get(http);
                var bookings = await bookingService.GetBookings(userId, role);
                return Results.Ok(bookings);
            });

            group.MapGet("/{id:int}/receipt", async (
                int id,
                HttpContext http,
                IReceiptService receiptService) =>
            {
                var (userId, role) = HttpUser.Get(http);

                try
                {
                    var receipt = await receiptService.GetForBooking(id, userId, role);
                    return receipt is null ? Results.NotFound() : Results.Ok(receipt);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            group.MapGet("/{id:int}/inspections", async (
                int id,
                HttpContext http,
                IInspectionService inspectionService) =>
            {
                var (userId, role) = HttpUser.Get(http);

                try
                {
                    var inspections = await inspectionService.Get(id, userId, role);
                    return Results.Ok(inspections);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            group.MapPost("/{id:int}/inspections/{phase}/photos", async (
                int id,
                string phase,
                IFormFile file,
                HttpContext http,
                IInspectionService inspectionService) =>
            {
                if (!Enum.TryParse<InspectionPhase>(phase, true, out var parsedPhase))
                    return Results.BadRequest(new { error = "Unknown inspection phase." });

                var (userId, _) = HttpUser.Get(http);

                try
                {
                    await using var stream = file.OpenReadStream();
                    var photo = await inspectionService.Upload(id, parsedPhase, userId, stream, file.Length);
                    return Results.Ok(photo);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            })
            .DisableAntiforgery()
            .Accepts<IFormFile>("multipart/form-data");

            group.MapDelete("/{id:int}/inspections/{phase}/photos/{photoId:int}", async (
                int id,
                string phase,
                int photoId,
                HttpContext http,
                IInspectionService inspectionService) =>
            {
                if (!Enum.TryParse<InspectionPhase>(phase, true, out var parsedPhase))
                    return Results.BadRequest(new { error = "Unknown inspection phase." });

                var (userId, _) = HttpUser.Get(http);

                try
                {
                    await inspectionService.DeletePhoto(id, parsedPhase, photoId, userId);
                    return Results.NoContent();
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            group.MapPost("/{id:int}/inspections/{phase}/submit", async (
                int id,
                string phase,
                InspectionSubmitRequest request,
                HttpContext http,
                IInspectionService inspectionService) =>
            {
                if (!Enum.TryParse<InspectionPhase>(phase, true, out var parsedPhase))
                    return Results.BadRequest(new { error = "Unknown inspection phase." });

                var (userId, _) = HttpUser.Get(http);

                try
                {
                    var inspection = await inspectionService.Submit(id, parsedPhase, userId, request.Note);
                    return Results.Ok(inspection);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            });

            app.MapPost("/receipts/{id:int}/retry", async (
                int id,
                HttpContext http,
                IReceiptService receiptService) =>
            {
                var (_, role) = HttpUser.Get(http);

                try
                {
                    return Results.Ok(await receiptService.Retry(id, role));
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            }).RequireAuthorization("Admin");

            app.MapGet("/photos/{id:int}/file", async (
                int id,
                HttpContext http,
                IInspectionService inspectionService) =>
            {
                var (userId, role) = HttpUser.Get(http);

                try
                {
                    var (stream, contentType) = await inspectionService.GetPhotoFile(id, userId, role);
                    return Results.File(stream, contentType);
                }
                catch (Exception ex)
                {
                    return ApiResults.FromException(ex);
                }
            }).RequireAuthorization("Authenticated");
        }
    }

    public record InspectionSubmitRequest(string? Note);
}
