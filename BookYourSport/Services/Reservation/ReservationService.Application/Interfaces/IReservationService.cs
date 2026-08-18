using ReservationService.Application.DTOs;

namespace ReservationService.Application.Interfaces;

public interface IReservationService
{
    Task<ReservationDto?> CreateReservationAsync(Guid clubId, Guid courtId, CreateReservationDto createReservationDto);
    Task<ReservationDto?> RescheduleReservationAsync(Guid reservationId, RescueReservationDto rescueReservationDto);
    Task<bool> CancelReservationAsync(Guid reservationId);
    Task<List<ReservationDto>> GetByUserIdAsync(Guid userId);
    Task<List<ReservationDto>> GetByClubIdAsync(Guid clubId);
}