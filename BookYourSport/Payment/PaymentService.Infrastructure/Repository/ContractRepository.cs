using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;
using PaymentService.Infrastructure.Persistence;

namespace PaymentService.Infrastructure.Repositories;

public class ContractRepository : IContractRepository
{
    private readonly PaymentDbContext _dbContext;

    public ContractRepository(PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Adds a new contract to the database context.
    public async Task AddAsync(Contract contract)
    {
        await _dbContext.Contracts.AddAsync(contract);
    }

    // Retrieves a contract by its unique identifier.
    public async Task<Contract?> GetByIdAsync(Guid contractId)
    {
        return await _dbContext.Contracts
            .FirstOrDefaultAsync(x => x.Id == contractId);
    }

    // Persists pending changes to the database.
    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    // Retrieves the contract belonging to a specific user.
    public async Task<Contract?> GetByUserIdAsync(Guid userId)
    {
        return await _dbContext.Contracts
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }
}