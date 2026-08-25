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

        // A contract can only be signed while it is awaiting signature.
        if (contract.Status != ContractStatus.PendingSignature)
        {
            throw new InvalidOperationException(
                "Contract is not pending signature.");
        }

        // Apply the signing operation through the domain entity.
        contract.Sign();

        // Persist the updated contract after it has been signed.
        await _contractRepository.SaveChangesAsync();

        return contract;
    }
}