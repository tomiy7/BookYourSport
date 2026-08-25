using Microsoft.EntityFrameworkCore;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Interfaces;
using ReservationService.Infrastructure.Data;

namespace ReservationService.Infrastructure.Repositories;

public class ReservationRepository : RepositoryBase<Reservation>, IReservationRepository
{
    public ReservationRepository(ReservationDbContext context) : base(context)
    {
    }

    public async Task<List<Reservation>> GetByCourtAndDateAsync(Guid courtId, DateOnly date)
    {
        var dayStart = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        return await _context.Reservations
            .Where(r => r.CourtId == courtId
                        && r.Status != ReservationStatus.Cancelled
                        && r.StartTime < dayEnd
                        && r.StartTime > dayStart)
            .ToListAsync();
    }

    public async Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime)
    {
        return await _context.Reservations.AnyAsync(r => 
            r.CourtId == courtId &&
            r.Status != ReservationStatus.Cancelled &&
            r.StartTime < endTime && r.EndTime > startTime);
    }

    public async Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime, Guid excludeReservationId)
    {
        return await _context.Reservations.AnyAsync(r => 
            r.CourtId == courtId &&
            r.Id != excludeReservationId &&
            r.Status != ReservationStatus.Cancelled &&
            r.StartTime < endTime && r.EndTime > startTime);
    }

    public async Task<List<Reservation>> GetByUserAsync(Guid userId) =>
        await _context.Reservations
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.StartTime)
            .ToListAsync();
    

    public async Task<List<Reservation>> GetByClubAsync(Guid clubId) =>
        await _context.Reservations
            .Where(r => r.ClubId == clubId)
            .OrderByDescending(r => r.StartTime)
            .ToListAsync();
}