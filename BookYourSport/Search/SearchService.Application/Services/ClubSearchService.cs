using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;

namespace SearchService.Application.Services;

public class ClubSearchService : IClubSearchService
{
    private readonly IReservationServiceClient _reservationServiceClient;

    public ClubSearchService(IReservationServiceClient reservationServiceClient)
    {
        _reservationServiceClient = reservationServiceClient;
    }

    public async Task<SearchResultDto> SearchClubsAsync(SearchClubsRequestDto request)
    {
        var clubs = await _reservationServiceClient.GetClubsAsync();

        IEnumerable<ReservationClubDto> filteredClubs = clubs;

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Name.Contains(request.Name, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Address.City.Contains(request.City, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Street))
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Address.Street.Contains(request.Street, StringComparison.OrdinalIgnoreCase));
        }

        if (request.SurfaceType.HasValue)
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Courts.Any(court =>
                    court.IsActive &&
                    court.SurfaceType == request.SurfaceType.Value));
        }

        if (request.IsIndoor.HasValue)
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Courts.Any(court =>
                    court.IsActive &&
                    court.IsIndoor == request.IsIndoor.Value));
        }

        if (request.MinPrice.HasValue || request.MaxPrice.HasValue)
        {
            filteredClubs = filteredClubs.Where(c =>
                c.Courts.Any(court =>
                    court.IsActive &&
                    (!request.MinPrice.HasValue ||
                     court.PricePerHour.Amount >= request.MinPrice.Value) &&
                    (!request.MaxPrice.HasValue ||
                     court.PricePerHour.Amount <= request.MaxPrice.Value)));
        }

        filteredClubs = filteredClubs.Where(c => c.IsActive);

        filteredClubs = request.SortBy?.ToLowerInvariant() switch
        {
            "name" => filteredClubs.OrderBy(c => c.Name),

            "price_asc" => filteredClubs.OrderBy(c =>
                c.Courts
                    .Where(court => court.IsActive)
                    .Select(court => court.PricePerHour.Amount)
                    .DefaultIfEmpty()
                    .Min()),

            "price_desc" => filteredClubs.OrderByDescending(c =>
                c.Courts
                    .Where(court => court.IsActive)
                    .Select(court => court.PricePerHour.Amount)
                    .DefaultIfEmpty()
                    .Min()),

            _ => filteredClubs.OrderBy(c => c.Name)
        };

        var totalCount = filteredClubs.Count();

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        var pagedClubs = filteredClubs
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var result = pagedClubs
            .Select(MapToSearchDto)
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

    private static SearchClubDto MapToSearchDto(ReservationClubDto club)
    {
        return new SearchClubDto
        {
            Id = club.Id,
            Name = club.Name,
            City = club.Address.City,
            Street = club.Address.Street,
            StreetNumber = club.Address.StreetNumber,
            IsActive = club.IsActive,
            DistanceKm = null,

            Courts = club.Courts
                .Where(c => c.IsActive)
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
}