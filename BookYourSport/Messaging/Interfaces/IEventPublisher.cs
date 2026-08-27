namespace Messaging.Interfaces;

public interface IEventPublisher
{
    Task PublishAsync<T>(T @event);
}