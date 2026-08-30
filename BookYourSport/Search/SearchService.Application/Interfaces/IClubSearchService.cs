using SearchService.Application.DTOs;

namespace SearchService.Application.Interfaces;

public interface IClubSearchService
{
    Task<SearchResultDto> SearchClubsAsync(SearchClubsRequestDto request);
}