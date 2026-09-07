using Microsoft.EntityFrameworkCore;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Interfaces;
using ReservationService.Infrastructure.Data;

namespace ReservationService.Infrastructure.Repositories;

public class ClubRepository : RepositoryBase<TennisClub>, IClubRepository
{
    public ClubRepository(ReservationDbContext context) : base(context)
    {
    }
    
    public override async Task<TennisClub?> GetByIdAsync(Guid id) =>
        await _context.TennisClubs
            .Include(c => c.Courts)
            .Include(c => c.WorkingHours)
            .FirstOrDefaultAsync(c => c.Id == id);
    
    public override async Task<List<TennisClub>> GetAllAsync() =>
        await _context.TennisClubs
            .Include(c => c.Courts)
            .Include(c => c.WorkingHours)
            .ToListAsync();
}