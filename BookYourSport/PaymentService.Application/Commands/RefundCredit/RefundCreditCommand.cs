namespace PaymentService.Application.Commands.RefundCredit;

public record RefundCreditCommand(
    Guid UserId,
    int OriginalAmount,
    Guid ReferenceId,
    DateTime ReservationStart,
    DateTime CancellationTime);