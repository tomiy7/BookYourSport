using PaymentService.Application.Interfaces;

namespace PaymentService.Application.Commands.ChargeCredit;

public class ChargeCreditHandler
{
    private readonly ICreditAccountRepository _creditAccountRepository;

    public ChargeCreditHandler(
        ICreditAccountRepository creditAccountRepository)
    {
        _creditAccountRepository = creditAccountRepository;
    }

    public async Task Handle(ChargeCreditCommand command)
    {
        // Validate the requested charge amount before accessing the credit account.
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Charge amount must be greater than zero.",
                nameof(command.Amount));

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        // A user must have an existing credit account to pay for a reservation.
        if (account is null)
            throw new InvalidOperationException(
                "Credit account not found.");

        // The domain entity validates the available balance
        // and records the reservation charge.
        account.Charge(
            command.Amount,
            command.ReferenceId);

        await _creditAccountRepository.SaveAsync(account);
    }
}