using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace BikeBooking.Services
{
    public class NominatimGeocodingService : IGeocodingService
    {
        private static readonly SemaphoreSlim Gate = new(1, 1);
        private static DateTime _lastRequestAt = DateTime.MinValue;

        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public NominatimGeocodingService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<GeocodeResult[]> Search(string query, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
                return [];

            var normalized = query.Trim().ToLowerInvariant();
            var cacheKey = $"geocode:{normalized}";

            if (_cache.TryGetValue<GeocodeResult[]>(cacheKey, out var cached) && cached is not null)
                return cached;

            await Gate.WaitAsync(cancellationToken);
            try
            {
                // Nominatim usage policy: at most one request per second.
                var sinceLast = DateTime.UtcNow - _lastRequestAt;
                var delay = TimeSpan.FromMilliseconds(1100) - sinceLast;
                if (delay > TimeSpan.Zero)
                    await Task.Delay(delay, cancellationToken);

                _lastRequestAt = DateTime.UtcNow;

                var url = "search?format=jsonv2&limit=5&countrycodes=ru&accept-language=ru&q="
                          + Uri.EscapeDataString(query.Trim());

                using var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                var results = new List<GeocodeResult>();
                foreach (var item in document.RootElement.EnumerateArray())
                {
                    if (!item.TryGetProperty("lat", out var latElement)
                        || !item.TryGetProperty("lon", out var lonElement)
                        || !item.TryGetProperty("display_name", out var nameElement))
                    {
                        continue;
                    }

                    if (!double.TryParse(latElement.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var lat)
                        || !double.TryParse(lonElement.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var lon))
                    {
                        continue;
                    }

                    results.Add(new GeocodeResult(nameElement.GetString() ?? string.Empty, lat, lon));
                }

                var result = results.ToArray();
                _cache.Set(cacheKey, result, TimeSpan.FromHours(1));
                return result;
            }
            finally
            {
                Gate.Release();
            }
        }
    }
}
