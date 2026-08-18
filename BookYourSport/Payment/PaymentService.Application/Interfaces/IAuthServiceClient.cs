namespace PaymentService.Application.Interfaces;

using PaymentService.Application.DTOs;

public interface IAuthServiceClient
{
    Task<AuthUserDto?> GetUserAsync(Guid userId);

    Task NotifySubscriptionPaidAsync(
        Guid userId,
        Guid paymentId,
        Guid contractId,
        decimal amount,
        string currency);
}