namespace Messaging.Events;
public record PaymentSucceeded(
    Guid PaymentId,
    Guid UserId,
    Guid ReservationId,
    decimal Amount,
    string Currency
);