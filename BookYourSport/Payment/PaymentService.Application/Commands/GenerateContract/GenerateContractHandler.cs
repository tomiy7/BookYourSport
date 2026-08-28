using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Application.Commands.GenerateContract;

public class GenerateContractHandler
{
    private readonly IPdfContractGenerator _pdfContractGenerator;
    private readonly IAuthServiceClient _authServiceClient;
    private readonly IContractRepository _contractRepository;

    public GenerateContractHandler(
        IPdfContractGenerator pdfContractGenerator,
        IAuthServiceClient authServiceClient,
        IContractRepository contractRepository)
    {
        _pdfContractGenerator = pdfContractGenerator;
        _authServiceClient = authServiceClient;
        _contractRepository = contractRepository;
    }

    public async Task<Contract> Handle(
        GenerateContractCommand command)
    {
        // Retrieve user data from Auth Service before generating the contract.
        var user = await _authServiceClient.GetUserAsync(
            command.UserId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User was not found.");
        }

        // Generate the contract document using the user's data.
        var documentPath =
            await _pdfContractGenerator.GenerateContractAsync(
                user.Id,
                user.FirstName,
                user.LastName);

        // Create the domain contract with the generated document.
        var contract = new Contract(
            user.Id,
            documentPath);

        // Persist the newly generated contract.
        await _contractRepository.AddAsync(contract);
        await _contractRepository.SaveChangesAsync();

        // Notify Auth Service that the contract was generated.
        await _authServiceClient.NotifyContractGeneratedAsync(
            contract.UserId,
            contract.Id);

        return contract;
    }
}