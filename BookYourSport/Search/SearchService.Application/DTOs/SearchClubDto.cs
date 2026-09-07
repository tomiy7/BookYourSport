using SearchService.Domain.Enums;

namespace SearchService.Application.DTOs;

public class SearchClubDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string StreetNumber { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public List<SearchCourtDto> Courts { get; set; } = new();

    public double? DistanceKm { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class SearchCourtDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public SurfaceType SurfaceType { get; set; }
    public bool IsIndoor { get; set; }

    public decimal PricePerHour { get; set; }
    public string Currency { get; set; } = "RSD";
}