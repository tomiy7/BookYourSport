namespace PaymentService.Application.Interfaces;

public interface IAuthServiceClient
{
    Task NotifySubscriptionPaidAsync(
        Guid userId,
        Guid paymentId,
        decimal amount,
        string currency);
}