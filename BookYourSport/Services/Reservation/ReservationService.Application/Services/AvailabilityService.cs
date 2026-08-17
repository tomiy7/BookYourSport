using Microsoft.Extensions.Logging;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Interfaces;

namespace ReservationService.Application.Services;

public class AvailabilityService : IAvailabilityService
{
    private static readonly TimeSpan SlotDuration = TimeSpan.FromHours(1);
    
    private readonly IClubRepository _clubRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly ILogger<AvailabilityService> _logger;

    public AvailabilityService(IClubRepository clubRepository, IReservationRepository reservationRepository,
        ILogger<AvailabilityService> logger)
    {
        _clubRepository = clubRepository;
        _reservationRepository = reservationRepository;
        _logger = logger;
    }

    public async Task<List<AvailableSlotDto>?> GetAvailableSlotsAsync(Guid clubId, Guid courtId, DateOnly date)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        var court = club?.Courts.FirstOrDefault(c => c.Id == courtId);

        if (club == null || court == null)
        {
            _logger.LogWarning("Availability requested for non-existent club {ClubId} or court {CourtId}", clubId,
                courtId);
            return null;
        }

        if (!court.IsActive)
            return new List<AvailableSlotDto>();

        var workingHours = club.WorkingHours.FirstOrDefault(w => w.DayOfWeek == date.DayOfWeek);
        if (workingHours == null || workingHours.IsClosed)
            return new List<AvailableSlotDto>();

        var existingReservations = await _reservationRepository.GetByCourtAndDateAsync(courtId, date);

        var slots = new List<AvailableSlotDto>();
        var slotStart = date.ToDateTime(workingHours.OpenTime);
        var dayClose = date.ToDateTime(workingHours.CloseTime);

        while (slotStart + SlotDuration <= dayClose)
        {
            var slotEnd = slotStart + SlotDuration;
            
            var isTaken = existingReservations.Any(r => r.StartTime < slotEnd && r.EndTime > slotStart);
            var isInPast = slotStart < DateTime.UtcNow;

            if (!isTaken && !isInPast)
                slots.Add(new AvailableSlotDto { StartTime = slotStart, EndTime = slotEnd });
            
            slotStart = slotEnd;
        }
        
        return slots;
    }
}