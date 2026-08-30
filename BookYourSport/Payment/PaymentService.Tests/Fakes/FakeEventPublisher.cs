using Messaging.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakeEventPublisher : IEventPublisher
{
    public Task PublishAsync<T>(T @event)
    {
        return Task.CompletedTask;
    }
}