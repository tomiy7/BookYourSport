namespace Messaging.Interfaces;

public interface IEventConsumer
{
    Task StartAsync(CancellationToken cancellationToken);
}