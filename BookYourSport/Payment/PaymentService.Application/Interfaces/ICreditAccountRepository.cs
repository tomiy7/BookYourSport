using PaymentService.Domain.Entities;

namespace PaymentService.Application.Interfaces;

public interface ICreditAccountRepository
{
    Task<CreditAccount?> GetByUserIdAsync(Guid userId);
    Task SaveAsync(CreditAccount account);
}