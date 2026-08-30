using PaymentService.Application.Interfaces;
using Messaging.Events;
namespace PaymentService.Application.Commands.ChargeCredit;

public class ChargeCreditHandler
{
    private readonly ICreditAccountRepository _creditAccountRepository;
    private readonly IOutboxWriter _outboxWriter;
    public ChargeCreditHandler(
        ICreditAccountRepository creditAccountRepository,
        IOutboxWriter outboxWriter)
    {
        _creditAccountRepository = creditAccountRepository;
        _outboxWriter = outboxWriter;
    }

    public async Task Handle(ChargeCreditCommand command)
    {
        if (command.Amount <= 0)
            throw new ArgumentException(
                "Charge amount must be greater than zero.",
                nameof(command.Amount));

        if (command.UserId == Guid.Empty)
            throw new ArgumentException(
                "User ID cannot be empty.",
                nameof(command.UserId));

        if (command.ReferenceId == Guid.Empty)
            throw new ArgumentException(
                "Reference ID cannot be empty.",
                nameof(command.ReferenceId));

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        if (account is null)
            throw new InvalidOperationException(
                "Credit account not found.");

        var transaction = account.Charge(
            command.Amount,
            command.ReferenceId);

        _outboxWriter.Add(new PaymentSucceeded(
            PaymentId: transaction.Id,
            UserId: command.UserId,
            Amount: transaction.Amount,
            Currency: "RSD",
            ReservationId: command.ReferenceId
        ));

        await _creditAccountRepository.SaveAsync(account);
    }
}