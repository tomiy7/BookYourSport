using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Interfaces;

namespace ReservationService.Tests.Fakes;

public class FakeReservationRepository : IReservationRepository
{
    private readonly List<Reservation> _reservations = new();
    
    public bool SimulateUniqueConstraintViolationOnNextSave { get; set; }

    public void Seed(params Reservation[] reservations) => _reservations.AddRange(reservations);

    public Task<Reservation?> GetByIdAsync(Guid id) =>
        Task.FromResult(_reservations.FirstOrDefault(r => r.Id == id));

    public Task<List<Reservation>> GetAllAsync() =>
        Task.FromResult(_reservations.ToList());

    public Task AddAsync(Reservation reservation)
    {
        _reservations.Add(reservation);
        return Task.CompletedTask;
    }

    public void Update(Reservation reservation) { }

    public void Delete(Reservation reservation) => _reservations.RemoveAll(r => r.Id == reservation.Id);

    public Task<bool> SaveChangesAsync()
    {
        if (SimulateUniqueConstraintViolationOnNextSave)
        {
            SimulateUniqueConstraintViolationOnNextSave = false;
            throw new Microsoft.EntityFrameworkCore.DbUpdateException("Simulated unique constraint violation");
        }

        return Task.FromResult(true);
    }

    public Task<List<Reservation>> GetByCourtAndDateAsync(Guid courtId, DateOnly date)
    {
        var dayStart = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var result = _reservations.Where(r =>
            r.CourtId == courtId &&
            r.Status != ReservationStatus.Cancelled &&
            r.StartTime < dayEnd && r.EndTime > dayStart).ToList();

        return Task.FromResult(result);
    }

    public Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime)
    {
        var overlap = _reservations.Any(r =>
            r.CourtId == courtId &&
            r.Status != ReservationStatus.Cancelled &&
            r.StartTime < endTime && r.EndTime > startTime);

        return Task.FromResult(overlap);
    }

    public Task<bool> HasOverlapAsync(Guid courtId, DateTime startTime, DateTime endTime, Guid excludeReservationId)
    {
        var overlap = _reservations.Any(r =>
            r.CourtId == courtId &&
            r.Id != excludeReservationId &&
            r.Status != ReservationStatus.Cancelled &&
            r.StartTime < endTime && r.EndTime > startTime);

        return Task.FromResult(overlap);
    }

    public Task<List<Reservation>> GetByUserAsync(Guid userId) =>
        Task.FromResult(_reservations.Where(r => r.UserId == userId)
            .OrderByDescending(r => r.StartTime).ToList());

    public Task<List<Reservation>> GetByClubAsync(Guid clubId) =>
        Task.FromResult(_reservations.Where(r => r.ClubId == clubId)
            .OrderByDescending(r => r.StartTime).ToList());
}
