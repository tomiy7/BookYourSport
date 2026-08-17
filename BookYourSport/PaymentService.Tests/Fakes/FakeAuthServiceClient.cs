using PaymentService.Application.DTOs;
using PaymentService.Application.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakeAuthServiceClient : IAuthServiceClient
{
    public AuthUserDto? User { get; set; }

    public bool SubscriptionPaidNotificationSent { get; private set; }

    public Task<AuthUserDto?> GetUserAsync(Guid userId)
    {
        return Task.FromResult(User);
    }

    public Task NotifySubscriptionPaidAsync(
        Guid userId,
        Guid paymentId,
        Guid contractId,
        decimal amount,
        string currency)
    {
        SubscriptionPaidNotificationSent = true;

        return Task.CompletedTask;
    }
}