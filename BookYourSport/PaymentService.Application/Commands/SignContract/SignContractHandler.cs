using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Application.Commands.SignContract;

public class SignContractHandler
{
    private readonly IContractRepository _contractRepository;
    private readonly IAuthServiceClient _authServiceClient;

    public SignContractHandler(
        IContractRepository contractRepository,
        IAuthServiceClient authServiceClient)
    {
        _contractRepository = contractRepository;
        _authServiceClient = authServiceClient;
    }

    public async Task<Contract> Handle(
        SignContractCommand command)
    {
        var contract = await _contractRepository.GetByIdAsync(
            command.ContractId);

        if (contract == null)
        {
            throw new InvalidOperationException(
                "Contract was not found.");
        }

        if (contract.Status != ContractStatus.PendingSignature)
        {
            throw new InvalidOperationException(
                "Contract is not pending signature.");
        }

        contract.Sign();

        await _contractRepository.SaveChangesAsync();

        return contract;
    }
}