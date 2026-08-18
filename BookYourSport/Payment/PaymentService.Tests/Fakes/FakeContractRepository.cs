using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Tests.Fakes;

public class FakeContractRepository : IContractRepository
{
    public Contract? Contract { get; set; }

    public Contract? AddedContract { get; private set; }

    public bool SaveChangesCalled { get; private set; }

    public Task AddAsync(Contract contract)
    {
        AddedContract = contract;
        return Task.CompletedTask;
    }

    public Task<Contract?> GetByIdAsync(Guid contractId)
    {
        return Task.FromResult(Contract);
    }

    public Task<Contract?> GetByUserIdAsync(Guid userId)
    {
        return Task.FromResult(Contract);
    }

    public Task SaveChangesAsync()
    {
        SaveChangesCalled = true;
        return Task.CompletedTask;
    }
}