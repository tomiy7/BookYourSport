namespace PaymentService.Application.Commands.PaySubscription;

public record PaySubscriptionCommand(
    Guid UserId,
    decimal Amount,
    string Currency);