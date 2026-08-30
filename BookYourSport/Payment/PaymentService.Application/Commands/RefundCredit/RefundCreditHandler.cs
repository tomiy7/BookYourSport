using Messaging;
using Messaging.Events;
using Messaging.Interfaces;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Services;

namespace PaymentService.Application.Commands.RefundCredit;

public class RefundCreditHandler
{
    private readonly ICreditAccountRepository _creditAccountRepository;
    private readonly RefundPolicy _refundPolicy;
    private readonly IEventPublisher _eventPublisher;

    public RefundCreditHandler(
        ICreditAccountRepository creditAccountRepository,
        RefundPolicy refundPolicy,
        IEventPublisher eventPublisher)
    {
        _creditAccountRepository = creditAccountRepository;
        _refundPolicy = refundPolicy;
        _eventPublisher = eventPublisher;
    }

    public async Task<bool> Handle(RefundCreditCommand command)
    {
        if (command.UserId == Guid.Empty)
            throw new ArgumentException(
                "User ID cannot be empty.",
                nameof(command.UserId));

        if (command.ReferenceId == Guid.Empty)
            throw new ArgumentException(
                "Reference ID cannot be empty.",
                nameof(command.ReferenceId));

        var refundAmount = _refundPolicy.CalculateRefund(
            command.OriginalAmount,
            command.ReservationStart,
            command.CancellationTime);

        // No refund is required according to the cancellation policy.
        if (refundAmount == 0)
        {
            await _eventPublisher.PublishAsync(new ReservationCancelled(
                ReservationId: command.ReferenceId,
                UserId: command.UserId
            ));

            return true;
        }

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        if (account is null)
            throw new InvalidOperationException(
                "Credit account not found.");

        var transaction = account.Refund(
            refundAmount,
            command.ReferenceId);

        await _creditAccountRepository.SaveAsync(account);

        await _eventPublisher.PublishAsync(new RefundSucceeded(
            PaymentId: transaction.Id,
            UserId: command.UserId,
            ReservationId: command.ReferenceId,
            Amount: transaction.Amount,
            Currency: "RSD"
        ));
        return true;
    }
}