using SearchService.Application.DTOs;

namespace SearchService.Application.Interfaces;

public interface IReservationServiceClient
{
    Task<List<ReservationClubDto>> GetClubsAsync();
}