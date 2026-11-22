using BikeBooking.Services;

namespace BikeBooking.Host
{
    public static class AddressRoutesExtensions
    {
        public static void RegisterAddressRoutes(this WebApplication app)
        {
            app.MapGet("/addresses/search", async (string q, IGeocodingService geocodingService) =>
            {
                if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 3)
                    return Results.Ok(Array.Empty<AddressSuggestion>());

                var results = await geocodingService.Search(q);

                var suggestions = results
                    .Select(r => new AddressSuggestion(r.DisplayName, r.Latitude, r.Longitude))
                    .ToArray();

                return Results.Ok(suggestions);
            })
            .RequireAuthorization()
            .Produces<AddressSuggestion[]>();
        }
    }

    public record AddressSuggestion(string DisplayName, double Latitude, double Longitude);
}
