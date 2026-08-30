using Microsoft.AspNetCore.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using ReservationService.Application.Interfaces;

namespace ReservationService.Infrastructure.Payment;

public class PaymentServiceClient : IPaymentServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;


    public PaymentServiceClient(
        HttpClient httpClient,
        IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;

    }
    private void ForwardAuthorizationHeader()
    {
        var authorizationHeader =
            _httpContextAccessor.HttpContext?
                .Request.Headers.Authorization
                .FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(authorizationHeader))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                AuthenticationHeaderValue.Parse(authorizationHeader);
        }
    }

    public async Task ChargeAsync(
        Guid userId,
        decimal amount,
        Guid reservationId
     )
    {
        ForwardAuthorizationHeader();
        var request = new
        {
            UserId = userId,
            Amount = amount,
            ReferenceId = reservationId
        };

        var response = await _httpClient.PostAsJsonAsync(
            "/api/Charge",
            request);

        response.EnsureSuccessStatusCode();
    }
    public async Task RefundAsync(
        Guid userId,
        decimal originalAmount,
        Guid reservationId,
        DateTime reservationStart,
        DateTime cancellationTime
     )
    {
        ForwardAuthorizationHeader();
        var request = new
        {
            UserId = userId,
            OriginalAmount = originalAmount,
            ReferenceId = reservationId,
            ReservationStart = reservationStart,
            CancellationTime = cancellationTime
        };

        var response = await _httpClient.PostAsJsonAsync(
            "api/Refund",
            request);

        response.EnsureSuccessStatusCode();
    }
}