using SearchService.Application.DTOs;

namespace SearchService.Application.Interfaces;

public interface IGeocodingService
{
    Task<GeoLocationDto?> GeocodeAsync(
        string address,
        CancellationToken cancellationToken = default);
}