using PaymentService.Application.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakePaymentProcessor : IPaymentProcessor
{
    public PaymentResult Result { get; set; } = new()
    {
        IsSuccessful = true,
        PaymentId = Guid.NewGuid()
    };

    public Task<PaymentResult> ProcessPaymentAsync(
        Guid userId,
        decimal amount,
        string currency)
    {
        return Task.FromResult(Result);
    }
}