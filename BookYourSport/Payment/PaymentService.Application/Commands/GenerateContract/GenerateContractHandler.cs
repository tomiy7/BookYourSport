using PaymentService.Application.Common;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Application.Commands.GenerateContract;

public class GenerateContractHandler
{
    private readonly IPdfContractGenerator _pdfContractGenerator;
    private readonly IAuthServiceClient _authServiceClient;
    private readonly IContractRepository _contractRepository;
    private readonly SubscriptionSettings _subscriptionSettings;

    public GenerateContractHandler(
        IPdfContractGenerator pdfContractGenerator,
        IAuthServiceClient authServiceClient,
        IContractRepository contractRepository,
        SubscriptionSettings subscriptionSettings)
    {
        _pdfContractGenerator = pdfContractGenerator;
        _authServiceClient = authServiceClient;
        _contractRepository = contractRepository;
        _subscriptionSettings = subscriptionSettings;
    }

    public async Task<Contract> Handle(
        GenerateContractCommand command)
    {
        // Subscription price is defined by the backend configuration.
        var amount = _subscriptionSettings.Amount;
        var currency = _subscriptionSettings.Currency;

        if (amount <= 0)
        {
            throw new InvalidOperationException(
                "Subscription amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(currency))
        {
            throw new InvalidOperationException(
                "Subscription currency is not configured.");
        }

        // Retrieve user data from Auth Service
        // before generating the contract.
        var user = await _authServiceClient.GetUserAsync(
            command.UserId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User was not found.");
        }

        if (user.ApprovalStatus != AuthApprovalStatus.Approved)
        {
            throw new InvalidOperationException(
                "User must be approved by an admin before a contract can be generated.");
        }

        // Generate the contract document using the user's data
        // and the subscription price from backend configuration.
        var documentPath =
            await _pdfContractGenerator.GenerateContractAsync(
                user.Id,
                user.FirstName,
                user.LastName,
                amount,
                currency);

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