using PaymentService.Application.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakeOutboxWriter : IOutboxWriter
{
    public object? LastEvent { get; private set; }

    public void Add<T>(T eventMessage)
    {
        LastEvent = eventMessage;
    }
}