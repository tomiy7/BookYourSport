namespace SearchService.Application.DTOs;

public class SearchResultDto
{
    public List<SearchClubDto> Clubs { get; set; } = new();

    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}