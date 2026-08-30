using System.Net.Http.Json;
using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;

namespace SearchService.Infrastructure.Clients;

public class ReservationServiceClient : IReservationServiceClient
{
    private readonly HttpClient _httpClient;

    public ReservationServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<ReservationClubDto>> GetClubsAsync()
    {
        var clubs = await _httpClient.GetFromJsonAsync<List<ReservationClubDto>>(
            "api/clubs");

        return clubs ?? new List<ReservationClubDto>();
    }
}