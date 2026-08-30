using Microsoft.AspNetCore.Http;
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
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

        if (response.IsSuccessStatusCode)
            return;

        var detail = await TryReadErrorDetailAsync(response);

        // Payment servis vraća 422 sa porukom "Insufficient credit."
        // kad korisnik nema dovoljno kredita. To prepoznajemo ovde
        // kao poseban, imenovan slučaj da bi frontend mogao da
        // reaguje na to (npr. otvori top-up prozor) umesto da samo
        // dobije generičku grešku.
        if (response.StatusCode == HttpStatusCode.UnprocessableEntity &&
            detail is not null &&
            detail.Contains("Insufficient credit", StringComparison.OrdinalIgnoreCase))
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

    private static async Task<string?> TryReadErrorDetailAsync(
        HttpResponseMessage response)
    {
        try
        {
            var problem = await response.Content
                .ReadFromJsonAsync<ProblemDetailsBody>();

            return problem?.Detail;
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