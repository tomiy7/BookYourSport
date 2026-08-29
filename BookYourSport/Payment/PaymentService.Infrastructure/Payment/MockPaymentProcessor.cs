using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Payment;

public class MockPaymentProcessor : IPaymentProcessor
{
    public Task<PaymentResult> ProcessPaymentAsync(
        Guid userId,
        decimal amount,
        string currency)
    {
        // Simulates a successful payment for development and testing.
        var result = new PaymentResult
        {
            IsSuccessful = true,
            PaymentId = Guid.NewGuid()
        };

        return Task.FromResult(result);
    }
}