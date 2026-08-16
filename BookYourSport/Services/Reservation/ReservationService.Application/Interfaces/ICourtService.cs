using ReservationService.Application.DTOs;

namespace ReservationService.Application.Interfaces;

public interface ICourtService
{
    // sve vraca null ako klub (ili teren u sklopu njega) ne postoji
    Task<List<CourtDto>?> GetByClubIdAsync(Guid clubId);
    Task<CourtDto?> GetCourtByIdAsync(Guid clubId, Guid courtId);
    Task<CourtDto?> CreateCourtAsync(Guid clubId, CreateCourtDto courtDto);
    Task<CourtDto?> UpdateCourtAsync(Guid clubId, Guid courtId, UpdateCourtDto courtDto);
    Task<bool> DeleteCourtAsync(Guid clubId,  Guid courtId);
}