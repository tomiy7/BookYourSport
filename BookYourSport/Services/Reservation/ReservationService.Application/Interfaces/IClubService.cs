using ReservationService.Application.DTOs;

namespace ReservationService.Application.Interfaces;

public interface IClubService
{
    Task<List<ClubDto>> GetAllClubsAsync();
    Task<ClubDto?> GetClubByIdAsync(Guid id);
    Task<ClubDto> CreateClubAsync(CreateClubDto clubDto);
    Task<ClubDto?> UpdateClubAsync(Guid id, UpdateClubDto clubDto);
}