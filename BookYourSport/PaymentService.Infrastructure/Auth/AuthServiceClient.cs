using PaymentService.Application.Interfaces;
using System.Net.Http.Json;

namespace PaymentService.Infrastructure.Auth;

public class AuthServiceClient : IAuthServiceClient
{
    private readonly HttpClient _httpClient;

    public AuthServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task NotifySubscriptionPaidAsync(
    Guid userId,
    Guid paymentId,
    decimal amount,
    string currency)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/auth/subscription-paid",
            new
            {
                userId,
                paymentId,
                amount,
                currency
            });

        response.EnsureSuccessStatusCode();
    }
}