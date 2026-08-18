using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.Commands.TopUpCredit;

public class TopUpCreditHandler
{
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly ICreditAccountRepository _creditAccountRepository;

    public TopUpCreditHandler(
        IPaymentProcessor paymentProcessor,
        ICreditAccountRepository creditAccountRepository)
    {
        _paymentProcessor = paymentProcessor;
        _creditAccountRepository = creditAccountRepository;
    }

    public async Task<PaymentResult> Handle(TopUpCreditCommand command)
    {
        // Validate the requested top-up amount before processing the payment.
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Top-up amount must be greater than zero.",
                nameof(command.Amount));

        // Process the external payment before adding credit to the account.
        var paymentResult = await _paymentProcessor.ProcessPaymentAsync(
            command.UserId,
            command.Amount,
            command.Currency);

        // Credit is added only after the payment has been completed successfully.
        if (!paymentResult.IsSuccessful)
            return paymentResult;

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        // Create a credit account for the user if one does not exist yet.
        if (account is null)
        {
            account = new CreditAccount(command.UserId);
        }

        // Apply the successful payment to the user's credit balance.
        account.TopUp(
            command.Amount,
            paymentResult.PaymentId);

        await _creditAccountRepository.SaveAsync(account);

        return paymentResult;
    }
}