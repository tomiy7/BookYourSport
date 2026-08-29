using PaymentService.Domain.Contract;

namespace PaymentService.Application.Interfaces;

public interface IContractRepository
{
    Task AddAsync(Contract contract);
    Task<Contract?> GetByIdAsync(Guid contractId);
    Task<Contract?> GetByUserIdAsync(Guid userId);
    Task SaveChangesAsync();
}