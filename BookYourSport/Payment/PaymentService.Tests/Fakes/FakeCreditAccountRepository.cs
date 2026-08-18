using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Tests.Fakes;

public class FakeCreditAccountRepository : ICreditAccountRepository
{
    public CreditAccount? Account { get; set; }

    public CreditAccount? SavedAccount { get; private set; }

    public Task<CreditAccount?> GetByUserIdAsync(Guid userId)
    {
        return Task.FromResult(Account);
    }

    public Task SaveAsync(CreditAccount account)
    {
        SavedAccount = account;
        return Task.CompletedTask;
    }
}