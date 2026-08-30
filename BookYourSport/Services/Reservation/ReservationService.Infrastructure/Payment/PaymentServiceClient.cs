using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Exceptions;

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

        _httpClient.DefaultRequestHeaders.Authorization = null;

        if (!string.IsNullOrWhiteSpace(authorizationHeader))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                AuthenticationHeaderValue.Parse(authorizationHeader);
        }
    }

    public async Task ChargeAsync(
        Guid userId,
        decimal amount,
        Guid reservationId)
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

        if (response.IsSuccessStatusCode)
            return;

        var detail = await TryReadErrorDetailAsync(response);

        // Bez obzira koji HTTP status Payment Service vrati,
        // ako je razlog nedovoljno kredita, Reservation Service
        // treba frontend-u da vrati prepoznatljiv kod.
        if (!string.IsNullOrWhiteSpace(detail) &&
            detail.Contains(
                "Insufficient credit",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ReservationDomainException(
                "Nemaš dovoljno kredita za ovu rezervaciju.",
                "INSUFFICIENT_CREDIT");
        }

        throw new ReservationDomainException(
            detail ?? "Plaćanje nije uspelo. Pokušaj ponovo.");
    }

    public async Task RefundAsync(
        Guid userId,
        decimal originalAmount,
        Guid reservationId,
        DateTime reservationStart,
        DateTime cancellationTime)
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
            "/api/Refund",
            request);

        if (response.IsSuccessStatusCode)
            return;

        var detail = await TryReadErrorDetailAsync(response);

        throw new ReservationDomainException(
            detail ?? "Povraćaj kredita nije uspeo. Pokušaj ponovo.");
    }

    private static async Task<string?> TryReadErrorDetailAsync(
        HttpResponseMessage response)
    {
        try
        {
            var content = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(content))
                return null;

            try
            {
                var problem =
                    System.Text.Json.JsonSerializer.Deserialize<
                        ProblemDetailsBody>(
                        content,
                        new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                if (!string.IsNullOrWhiteSpace(problem?.Detail))
                    return problem.Detail;

                if (!string.IsNullOrWhiteSpace(problem?.Title))
                    return problem.Title;
            }
            catch
            {
                // Ako odgovor nije ProblemDetails JSON,
                // koristimo običan tekst odgovora.
            }

            return content;
        }
        catch
        {
            return null;
        }
    }

    private class ProblemDetailsBody
    {
        public string? Title { get; set; }

        public string? Detail { get; set; }
    }
}