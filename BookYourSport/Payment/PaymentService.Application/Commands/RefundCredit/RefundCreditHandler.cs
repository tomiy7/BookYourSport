using PaymentService.Application.Interfaces;
using PaymentService.Domain.Services;

namespace PaymentService.Application.Commands.RefundCredit;

public class RefundCreditHandler
{
    private readonly ICreditAccountRepository _creditAccountRepository;
    private readonly RefundPolicy _refundPolicy;

    public RefundCreditHandler(
        ICreditAccountRepository creditAccountRepository,
        RefundPolicy refundPolicy)
    {
        _creditAccountRepository = creditAccountRepository;
        _refundPolicy = refundPolicy;
    }

    public async Task Handle(RefundCreditCommand command)
    {
        // Calculate the refund according to the cancellation policy.
        var refundAmount = _refundPolicy.CalculateRefund(
            command.OriginalAmount,
            command.ReservationStart,
            command.CancellationTime);

        // No credit account or transaction is changed when no refund is allowed.
        if (refundAmount == 0)
            return;

        var account = await _creditAccountRepository
            .GetByUserIdAsync(command.UserId);

        if (account is null)
            throw new InvalidOperationException(
                "Credit account not found.");

        // Apply the refund to the account and prevent duplicate refunds
        // through the domain entity.
        account.Refund(
            refundAmount,
            command.ReferenceId);

        await _creditAccountRepository.SaveAsync(account);
    }
}