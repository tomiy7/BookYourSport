using ReservationService.Domain.Entities;
using ReservationService.Domain.Interfaces;

namespace ReservationService.Tests.Fakes;

public class FakeClubRepository : IClubRepository
{
    private readonly List<TennisClub> _clubs = new();

    public void Seed(params TennisClub[] clubs) => _clubs.AddRange(clubs);

    public Task<TennisClub?> GetByIdAsync(Guid id) =>
        Task.FromResult(_clubs.FirstOrDefault(c => c.Id == id));

    public Task<List<TennisClub>> GetAllAsync() =>
        Task.FromResult(_clubs.ToList());

    public Task AddAsync(TennisClub club)
    {
        _clubs.Add(club);
        return Task.CompletedTask;
    }

    public void Update(TennisClub club)
    { }

    public void Delete(TennisClub club) => _clubs.RemoveAll(c => c.Id == club.Id);

    public Task<bool> SaveChangesAsync() => Task.FromResult(true);
}