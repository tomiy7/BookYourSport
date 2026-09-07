using Microsoft.EntityFrameworkCore;
using ReservationService.Domain.Common;
using ReservationService.Domain.Interfaces;
using ReservationService.Infrastructure.Data;

namespace ReservationService.Infrastructure.Repositories;

public class RepositoryBase<T> : IAsyncRepository<T> where T : AggregateRoot
{
    protected readonly ReservationDbContext _context;
    
    public RepositoryBase(ReservationDbContext context)
    {
        _context = context;
    }
    
    public virtual async Task<T?> GetByIdAsync(Guid id) => 
        await _context.Set<T>().FirstOrDefaultAsync(e => e.Id == id);

    public virtual async Task<List<T>> GetAllAsync() =>
        await _context.Set<T>().ToListAsync();
    
    public async Task AddAsync(T entity) =>
        await _context.Set<T>().AddAsync(entity);

    public void Update(T entity) =>
        _context.Set<T>().Update(entity);

    public void Delete(T entity) =>
        _context.Set<T>().Remove(entity);

    public async Task<bool> SaveChangesAsync() =>
        await _context.SaveChangesAsync() > 0;
}