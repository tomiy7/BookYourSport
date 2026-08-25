using ReservationService.Domain.Common;

namespace ReservationService.Domain.Interfaces;

public interface IAsyncRepository<T> where T : AggregateRoot
{
    Task<T?>GetByIdAsync(Guid id);
    Task<List<T>> GetAllAsync();
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
    Task<bool> SaveChangesAsync();
}