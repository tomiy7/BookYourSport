namespace PaymentService.Application.Commands.RefundCredit;

public record RefundCreditCommand(
    Guid UserId,
    decimal OriginalAmount,
    Guid ReferenceId,
    DateTime ReservationStart,
    DateTime CancellationTime,

    // true = refund zbog otkazivanja rezervacije
    // false = refund razlike zbog reschedule-a
    bool CancelReservation
);