using PaymentService.Application.DTOs;
using PaymentService.Application.Interfaces;
using System.Net;
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
    Guid contractId,
    decimal amount,
    string currency)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "/auth/subscription-paid",
            new
            {
                userId,
                paymentId,
                contractId,
                amount,
                currency
            });

        response.EnsureSuccessStatusCode();
    }

    public async Task<AuthUserDto?> GetUserAsync(Guid userId)
    {
        var response = await _httpClient.GetAsync(
            $"/auth/users/{userId}");

        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AuthUserDto>();
    }
}