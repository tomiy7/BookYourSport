using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.Commands.TopUpCredit;

public class TopUpCreditHandler
{
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly ICreditAccountRepository _creditAccountRepository;

    public TopUpCreditHandler(
        IPaymentProcessor paymentProcessor,
        ICreditAccountRepository creditAccountRepository
        )
    {
        _paymentProcessor = paymentProcessor;
        _creditAccountRepository = creditAccountRepository;
    }
    public async Task<PaymentResult> Handle(TopUpCreditCommand command)
    {
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Top-up amount must be greater than zero.",
                nameof(command.Amount));

        var paymentResult = await _paymentProcessor.ProcessPaymentAsync(
            command.UserId,
            command.Amount,
            command.Currency);


        if (!paymentResult.IsSuccessful)
            return paymentResult;

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        if (account is null)
        {
            account = new CreditAccount(command.UserId);
        }

        account.TopUp(
            (int)command.Amount,
            paymentResult.PaymentId
         );
        await _creditAccountRepository.SaveAsync(account);
        return paymentResult;
    }
}