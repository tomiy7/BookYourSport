using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;
using PaymentService.Infrastructure.Persistence;

namespace PaymentService.Infrastructure.Repositories;

public class ContractRepository : IContractRepository
{
    private readonly PaymentDbContext _dbContext;

    public ContractRepository(
        PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        Contract contract)
    {
        await _dbContext.Contracts.AddAsync(
            contract);
    }

    public async Task<Contract?> GetByIdAsync(
        Guid contractId)
    {
        return await _dbContext.Contracts
            .FirstOrDefaultAsync(
                x => x.Id == contractId);
    }

    public async Task<Contract?> GetByUserIdAsync(
        Guid userId)
    {
        return await _dbContext.Contracts
            .Where(x => x.UserId == userId)
            .OrderByDescending(
                x => x.Status == ContractStatus.Signed)
            .ThenByDescending(
                x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<Contract?> GetSignedByUserIdAsync(
        Guid userId)
    {
        return await _dbContext.Contracts
            .Where(x =>
                x.UserId == userId &&
                x.Status == ContractStatus.Signed)
            .OrderByDescending(
                x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}