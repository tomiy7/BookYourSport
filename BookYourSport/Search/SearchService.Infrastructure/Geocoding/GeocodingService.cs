using System.Globalization;
using System.Net.Http.Json;
using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;
using SearchService.Infrastructure.Caching;

namespace SearchService.Infrastructure.Geocoding;

public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly RedisGeocodingCache _cache;

    public GeocodingService(
        HttpClient httpClient,
        RedisGeocodingCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
    }

    public async Task<GeoLocationDto?> GeocodeAsync(
        string address,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"GEOCODING ADDRESS: {address}");
        var cached = await _cache.GetAsync(address);

        if (cached.HasValue)
        {
            return new GeoLocationDto
            {
                Latitude = cached.Value.Latitude,
                Longitude = cached.Value.Longitude
            };
        }

        var response = await _httpClient.GetFromJsonAsync<List<NominatimSearchResult>>(
            $"search?q={Uri.EscapeDataString(address)}&format=jsonv2&limit=1",
            cancellationToken);

        var result = response?.FirstOrDefault();
        Console.WriteLine($"GEOCODING RESULT: {result?.Latitude}, {result?.Longitude}");
        if (result == null)
            return null;

        if (!double.TryParse(
                result.Latitude,
                CultureInfo.InvariantCulture,
                out var latitude))
        {
            return null;
        }

        if (!double.TryParse(
                result.Longitude,
                CultureInfo.InvariantCulture,
                out var longitude))
        {
            return null;
        }

        await _cache.SetAsync(
            address,
            latitude,
            longitude,
            TimeSpan.FromDays(30));

        return new GeoLocationDto
        {
            Latitude = latitude,
            Longitude = longitude
        };
    }
}