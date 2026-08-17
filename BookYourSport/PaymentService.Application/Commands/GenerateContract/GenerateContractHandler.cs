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
        var user = await _authServiceClient.GetUserAsync(
            command.UserId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User was not found.");
        }

        var documentPath =
            await _pdfContractGenerator.GenerateContractAsync(
                user.Id,
                user.FirstName,
                user.LastName);

        var contract = new Contract(
            user.Id,
            documentPath);

        await _contractRepository.AddAsync(contract);
        await _contractRepository.SaveChangesAsync();

        return contract;
    }
}
