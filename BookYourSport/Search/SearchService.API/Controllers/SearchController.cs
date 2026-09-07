using Microsoft.AspNetCore.Mvc;
using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;

namespace SearchService.API.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly IClubSearchService _clubSearchService;

    public SearchController(IClubSearchService clubSearchService)
    {
        _clubSearchService = clubSearchService;
    }

    [HttpGet("clubs")]
    [ProducesResponseType(typeof(SearchResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchClubs(
        [FromQuery] SearchClubsRequestDto request)
    {
        var result = await _clubSearchService.SearchClubsAsync(request);

        return Ok(result);
    }
}