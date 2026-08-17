using ReservationService.Application.DTOs;

namespace ReservationService.Application.Interfaces;

public interface IAvailabilityService
{
    Task<List<AvailableSlotDto>?> GetAvailableSlotsAsync(Guid clubId, Guid courtId, DateOnly date);
}