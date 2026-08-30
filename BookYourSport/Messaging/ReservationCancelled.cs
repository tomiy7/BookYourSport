namespace Messaging;

public record ReservationCancelled(
    Guid ReservationId,
    Guid UserId
);