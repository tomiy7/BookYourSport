using System.Net.Http.Json;
using ReservationService.Application.Interfaces;

namespace ReservationService.Infrastructure.Payment;

public class PaymentServiceClient : IPaymentServiceClient
{
    private readonly HttpClient _httpClient;

    public PaymentServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task ChargeAsync(
        Guid userId,
        decimal amount,
        Guid reservationId)
    {
        var request = new
        {
            UserId = userId,
            Amount = amount,
            ReferenceId = reservationId
        };

        var response = await _httpClient.PostAsJsonAsync(
            "api/Charge",
            request);

        response.EnsureSuccessStatusCode();
    }

    public async Task RefundAsync(
        Guid userId,
        decimal originalAmount,
        Guid reservationId,
        DateTime reservationStart,
        DateTime cancellationTime)
    {
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