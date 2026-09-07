using ReservationService.Domain.Entities;

namespace ReservationService.Domain.Interfaces;

public interface IReservationRepository : IAsyncRepository<Reservation>
{
    Task<List<Reservation>> GetByCourtAndDateAsync(Guid courtId, DateOnly date);
    
    // Checks if there is a slot already reserved for the slot
    // To prevent double booking
    Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime);
    
    // Same as the one abpve. but excludes the reservation that is being rescheduled
    // fe. from 9:00-10:00 to 9:30-10:30, this one overlaps and using the one above method
    // the reschedule will be denied
    Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime, Guid excludeReservationId);
    
    Task<List<Reservation>> GetByUserAsync(Guid userId);
    Task<List<Reservation>> GetByClubAsync(Guid clubId);
}