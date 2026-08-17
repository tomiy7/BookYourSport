using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Infrastructure.Persistence;

namespace PaymentService.Infrastructure.Repositories;

public class CreditAccountRepository : ICreditAccountRepository
{
    private readonly PaymentDbContext _dbContext;

    public CreditAccountRepository(PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Retrieves the credit account belonging to the specified user.
    public async Task<CreditAccount?> GetByUserIdAsync(Guid userId)
    {
        return await _dbContext.CreditAccounts
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    // Adds a new credit account when necessary and persists the current account state.
    public async Task SaveAsync(CreditAccount account)
    {
        var existingAccount = await _dbContext.CreditAccounts
            .FirstOrDefaultAsync(x => x.Id == account.Id);

        if (existingAccount is null)
        {
            await _dbContext.CreditAccounts.AddAsync(account);
        }

        await _dbContext.SaveChangesAsync();
    }
}