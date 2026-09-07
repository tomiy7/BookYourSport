using System.Text.Json.Serialization;

namespace SearchService.Infrastructure.Geocoding;

public class NominatimSearchResult
{
    [JsonPropertyName("lat")]
    public string Latitude { get; set; } = string.Empty;

    [JsonPropertyName("lon")]
    public string Longitude { get; set; } = string.Empty;
}