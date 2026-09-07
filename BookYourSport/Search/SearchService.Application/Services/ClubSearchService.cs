using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;

namespace SearchService.Application.Services;

public class ClubSearchService : IClubSearchService
{
    private readonly IReservationServiceClient _reservationServiceClient;
    private readonly IGeocodingService _geocodingService;

    public ClubSearchService(
        IReservationServiceClient reservationServiceClient,
        IGeocodingService geocodingService
        )
    {
        _reservationServiceClient = reservationServiceClient;
        _geocodingService = geocodingService;
    }

    private static double CalculateDistanceKm(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2
    )
    {
        const double earthRadiusKm = 6371.0;

        var lat1 = DegreesToRadians(latitude1);
        var lat2 = DegreesToRadians(latitude2);

        var deltaLat = DegreesToRadians(latitude2 - latitude1);
        var deltaLon = DegreesToRadians(longitude2 - longitude1);

        var a =
            Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
            Math.Cos(lat1) *
            Math.Cos(lat2) *
            Math.Sin(deltaLon / 2) *
            Math.Sin(deltaLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }

    public async Task<SearchResultDto> SearchClubsAsync(SearchClubsRequestDto request)
    {
        var clubs = await _reservationServiceClient.GetClubsAsync();

        IEnumerable<FilteredClub> filteredResults = clubs
            .Where(c => c.IsActive)
            .Where(c =>
                string.IsNullOrWhiteSpace(request.Query) ||
                c.Name.Contains(request.Query, StringComparison.OrdinalIgnoreCase) ||
                c.Address.City.Contains(request.Query, StringComparison.OrdinalIgnoreCase) ||
                c.Address.Street.Contains(request.Query, StringComparison.OrdinalIgnoreCase))
            .Where(c =>
                string.IsNullOrWhiteSpace(request.Name) ||
                c.Name.Contains(request.Name, StringComparison.OrdinalIgnoreCase))
            .Where(c =>
                string.IsNullOrWhiteSpace(request.City) ||
                c.Address.City.Contains(request.City, StringComparison.OrdinalIgnoreCase))
            .Where(c =>
                string.IsNullOrWhiteSpace(request.Street) ||
                c.Address.Street.Contains(request.Street, StringComparison.OrdinalIgnoreCase))
            .Select(c => new FilteredClub
            {
                Club = c,
                Courts = c.Courts
                    .Where(court => court.IsActive)
                    .Where(court =>
                        request.SurfaceTypes == null ||
                        request.SurfaceTypes.Count == 0 ||
                        request.SurfaceTypes.Contains(court.SurfaceType))
                    .Where(court =>
                        !request.IsIndoor.HasValue ||
                        court.IsIndoor == request.IsIndoor.Value)
                    .Where(court =>
                        !request.MinPrice.HasValue ||
                        court.PricePerHour.Amount >= request.MinPrice.Value)
                    .Where(court =>
                        !request.MaxPrice.HasValue ||
                        court.PricePerHour.Amount <= request.MaxPrice.Value)
                    .ToList()
            })
            .Where(x => x.Courts.Any())
            .ToList();

        double? userLatitude = request.Latitude;
        double? userLongitude = request.Longitude;

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            var userLocation = await _geocodingService.GeocodeAsync(request.Address);

            if (userLocation != null)
            {
                userLatitude = userLocation.Latitude;
                userLongitude = userLocation.Longitude;
            }
        }

        if (userLatitude.HasValue && userLongitude.HasValue)
        {
            foreach (var item in filteredResults)
            {
                var address =
                    $"{item.Club.Address.Country}, " +
                    $"{item.Club.Address.City}, " +
                    $"{item.Club.Address.Street} " +
                    $"{item.Club.Address.StreetNumber}";

                var location = await _geocodingService.GeocodeAsync(address);

                if (location != null)
                {
                    item.Latitude = location.Latitude;
                    item.Longitude = location.Longitude;

                    item.DistanceKm = CalculateDistanceKm(
                        userLatitude.Value,
                        userLongitude.Value,
                        location.Latitude,
                        location.Longitude);
                }
            }
        }

        if (request.MaxDistanceKm.HasValue)
        {
            filteredResults = filteredResults
                .Where(x =>
                    x.DistanceKm.HasValue &&
                    x.DistanceKm.Value <= request.MaxDistanceKm.Value);
        }

        var sortCriteria = request.SortBy?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.ToLowerInvariant())
            .ToList() ?? new List<string>();

        if (sortCriteria.Count == 0)
        {
            sortCriteria.Add("name_asc");
        }

        IOrderedEnumerable<FilteredClub>? orderedResults = null;

        foreach (var sort in sortCriteria)
        {
            if (orderedResults == null)
            {
                orderedResults = sort switch
                {
                    "name_asc" => filteredResults
                        .OrderBy(x => x.Club.Name),

                    "name_desc" => filteredResults
                        .OrderByDescending(x => x.Club.Name),

                    "city_asc" => filteredResults
                        .OrderBy(x => x.Club.Address.City),

                    "city_desc" => filteredResults
                        .OrderByDescending(x => x.Club.Address.City),

                    "address_asc" => filteredResults
                        .OrderBy(x => x.Club.Address.Street)
                        .ThenBy(x => x.Club.Address.StreetNumber),

                    "address_desc" => filteredResults
                        .OrderByDescending(x => x.Club.Address.Street)
                        .ThenByDescending(x => x.Club.Address.StreetNumber),

                    "price_asc" => filteredResults
                        .OrderBy(x =>
                            x.Courts
                                .Select(court => court.PricePerHour.Amount)
                                .Min()),

                    "price_desc" => filteredResults
                        .OrderByDescending(x =>
                            x.Courts
                                .Select(court => court.PricePerHour.Amount)
                                .Min()),

                    "distance_asc" => filteredResults
                        .OrderBy(x => x.DistanceKm ?? double.MaxValue),

                    "distance_desc" => filteredResults
                        .OrderByDescending(x => x.DistanceKm ?? double.MinValue),

                    _ => filteredResults
                        .OrderBy(x => x.Club.Name)
                };
            }
            else
            {
                orderedResults = sort switch
                {
                    "name_asc" => orderedResults
                        .ThenBy(x => x.Club.Name),

                    "name_desc" => orderedResults
                        .ThenByDescending(x => x.Club.Name),

                    "city_asc" => orderedResults
                        .ThenBy(x => x.Club.Address.City),

                    "city_desc" => orderedResults
                        .ThenByDescending(x => x.Club.Address.City),

                    "address_asc" => orderedResults
                        .ThenBy(x => x.Club.Address.Street)
                        .ThenBy(x => x.Club.Address.StreetNumber),

                    "address_desc" => orderedResults
                        .ThenByDescending(x => x.Club.Address.Street)
                        .ThenByDescending(x => x.Club.Address.StreetNumber),

                    "price_asc" => orderedResults
                        .ThenBy(x =>
                            x.Courts
                                .Select(court => court.PricePerHour.Amount)
                                .Min()),

                    "price_desc" => orderedResults
                        .ThenByDescending(x =>
                            x.Courts
                                .Select(court => court.PricePerHour.Amount)
                                .Min()),

                    "distance_asc" => orderedResults
                        .ThenBy(x => x.DistanceKm ?? double.MaxValue),

                    "distance_desc" => orderedResults
                        .ThenByDescending(x => x.DistanceKm ?? double.MinValue),

                    _ => orderedResults
                };
            }
        }

        filteredResults = orderedResults!;

        var totalCount = filteredResults.Count();

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        var pagedResults = filteredResults
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var result = pagedResults
             .Select(x => MapToSearchDto(
                    x.Club,
                    x.Courts,
                    x.DistanceKm,
                    x.Latitude,
                    x.Longitude))
                .ToList();

        return new SearchResultDto
        {
            Clubs = result,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    private static SearchClubDto MapToSearchDto(
      ReservationClubDto club,
      IEnumerable<ReservationCourtDto> courts,
      double? distanceKm,
      double? latitude,
      double? longitude)
    {
        return new SearchClubDto
        {
            Id = club.Id,
            Name = club.Name,
            City = club.Address.City,
            Street = club.Address.Street,
            StreetNumber = club.Address.StreetNumber,
            IsActive = club.IsActive,

            Latitude = latitude,
            Longitude = longitude,
            DistanceKm = distanceKm,

            Courts = courts
                .Select(c => new SearchCourtDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SurfaceType = c.SurfaceType,
                    IsIndoor = c.IsIndoor,
                    PricePerHour = c.PricePerHour.Amount,
                    Currency = c.PricePerHour.Currency
                })
                .ToList()
        };
    }

    private sealed class FilteredClub
    {
        public ReservationClubDto Club { get; init; } = null!;
        public List<ReservationCourtDto> Courts { get; init; } = new();
        public double? DistanceKm { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
