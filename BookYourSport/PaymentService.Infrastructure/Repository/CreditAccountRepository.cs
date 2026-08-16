using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using System.Linq;

namespace PaymentService.Infrastructure.Repositories;

public class CreditAccountRepository : ICreditAccountRepository
{
    private readonly List<CreditAccount> _accounts = new();
    public Task<CreditAccount?> GetByUserIdAsync(Guid userId)
    {
        var account = _accounts
            .FirstOrDefault(x => x.UserId == userId);

        return Task.FromResult(account);
    }
    public Task SaveAsync(CreditAccount account)
    {
        var existingAccount = _accounts
            .FirstOrDefault(x => x.Id == account.Id);

        if (existingAccount is null)
        {
            _accounts.Add(account);
        }

        return Task.CompletedTask;
    }
}