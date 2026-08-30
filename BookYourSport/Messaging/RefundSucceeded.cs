namespace Messaging.Events;

public record RefundSucceeded(
    Guid PaymentId,
    Guid UserId,
    Guid ReservationId,
    decimal Amount,
    string Currency
);