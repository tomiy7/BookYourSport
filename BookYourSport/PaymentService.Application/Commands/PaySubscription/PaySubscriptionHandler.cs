using PaymentService.Application.Interfaces;

namespace PaymentService.Application.Commands.PaySubscription;

public class PaySubscriptionHandler
{
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly IAuthServiceClient _authServiceClient;

    public PaySubscriptionHandler(
        IPaymentProcessor paymentProcessor,
        IAuthServiceClient authServiceClient)
    {
        _paymentProcessor = paymentProcessor;
        _authServiceClient = authServiceClient;
    }

    public async Task<PaymentResult> Handle(
        PaySubscriptionCommand command)
    {
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Subscription amount must be greater than zero.",
                nameof(command.Amount));

        var result = await _paymentProcessor.ProcessPaymentAsync(
            command.UserId,
            command.Amount,
            command.Currency);

        if (!result.IsSuccessful)
            return result;

        await _authServiceClient.NotifySubscriptionPaidAsync(
            command.UserId,
            result.PaymentId,
            command.Amount,
            command.Currency
         );

        return result;
    }
}