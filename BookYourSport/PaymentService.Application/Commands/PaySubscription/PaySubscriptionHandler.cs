using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Application.Commands.PaySubscription;

public class PaySubscriptionHandler
{
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly IAuthServiceClient _authServiceClient;
    private readonly IContractRepository _contractRepository;

    public PaySubscriptionHandler(
        IPaymentProcessor paymentProcessor,
        IAuthServiceClient authServiceClient,
        IContractRepository contractRepository
        )
    {
        _paymentProcessor = paymentProcessor;
        _authServiceClient = authServiceClient;
        _contractRepository = contractRepository;

    }

    public async Task<PaymentResult> Handle(
        PaySubscriptionCommand command)
    {
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Subscription amount must be greater than zero.",
                nameof(command.Amount));

        var contract = await _contractRepository.GetByUserIdAsync(
            command.UserId);

        if (contract == null)
        {
            throw new InvalidOperationException(
                "Contract was not found.");
        }

        if (contract.Status != ContractStatus.Signed)
        {
            throw new InvalidOperationException(
                "Contract must be signed before subscription payment.");
        }

        var result = await _paymentProcessor.ProcessPaymentAsync(
            command.UserId,
            command.Amount,
            command.Currency);

        if (!result.IsSuccessful)
            return result;

        await _authServiceClient.NotifySubscriptionPaidAsync(
            command.UserId,
            result.PaymentId,
            contract.Id,
            command.Amount,
            command.Currency
        );

        return result;
    }
}