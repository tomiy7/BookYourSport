using PaymentService.Application.DTOs;
using PaymentService.Application.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakeAuthServiceClient : IAuthServiceClient
{
    public AuthUserDto? User { get; set; }

    public bool SubscriptionPaidNotificationSent { get; private set; }

    public bool ContractGeneratedNotificationSent { get; private set; }
    
    public bool ContractSignedNotificationSent { get; private set; }

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

    public Task NotifyContractGeneratedAsync(
        Guid userId,
        Guid contractId)
    {
        ContractGeneratedNotificationSent = true;

        return Task.CompletedTask;
    }
    
    public Task NotifyContractSignedAsync(
        Guid userId,
        Guid contractId)
    {
        ContractSignedNotificationSent = true;

        return Task.CompletedTask;
    }
}