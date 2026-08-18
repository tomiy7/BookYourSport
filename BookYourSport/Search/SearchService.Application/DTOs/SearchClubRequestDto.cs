using SearchService.Domain.Enums;

namespace SearchService.Application.DTOs;

public class SearchClubsRequestDto
{
    public string? Name { get; set; }
    public string? City { get; set; }
    public string? Street { get; set; }

    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    public SurfaceType? SurfaceType { get; set; }
    public bool? IsIndoor { get; set; }
    public bool? IsOpen { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? MaxDistanceKm { get; set; }

    public string? SortBy { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}