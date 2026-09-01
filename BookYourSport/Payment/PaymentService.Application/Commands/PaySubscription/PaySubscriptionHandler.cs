using PaymentService.Application.Common;
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
        IContractRepository contractRepository)
    {
        _paymentProcessor = paymentProcessor;
        _authServiceClient = authServiceClient;
        _contractRepository = contractRepository;
    }

    public async Task<PaymentResult> Handle(
        PaySubscriptionCommand command)
    {
        // Validate the subscription amount before processing the payment.
        if (command.Amount <= 0)
        {
            throw new ArgumentException(
                "Subscription amount must be greater than zero.",
                nameof(command.Amount));
        }

        // Payment is allowed only for a SIGNED contract.
        var contract =
            await _contractRepository.GetSignedByUserIdAsync(
                command.UserId);

        if (contract == null)
        {
            throw new InvalidOperationException(
                "A signed contract was not found.");
        }

        var user =
            await _authServiceClient.GetUserAsync(
                command.UserId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User was not found.");
        }

        if (
            user.ApprovalStatus !=
            AuthApprovalStatus.Approved)
        {
            throw new InvalidOperationException(
                "User must be approved by an admin before subscription payment.");
        }

        // Process the subscription payment only after
        // all prerequisites are satisfied.
        var result =
            await _paymentProcessor.ProcessPaymentAsync(
                command.UserId,
                command.Amount,
                command.Currency);

        // Do not approve the subscription if
        // the payment was unsuccessful.
        if (!result.IsSuccessful)
        {
            return result;
        }

        // Notify Auth Service so the Club Owner status
        // can be updated.
        await _authServiceClient.NotifySubscriptionPaidAsync(
            command.UserId,
            result.PaymentId,
            contract.Id,
            command.Amount,
            command.Currency);

        return result;
    }
}