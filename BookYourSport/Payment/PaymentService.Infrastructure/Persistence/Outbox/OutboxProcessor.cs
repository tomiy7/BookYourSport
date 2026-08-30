using System.Text.Json;
using Messaging.Events;
using Messaging.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace PaymentService.Infrastructure.Persistence.Outbox;

public class OutboxProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OutboxProcessor> _logger;

    public OutboxProcessor(
        IServiceScopeFactory scopeFactory,
        ILogger<OutboxProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while processing outbox messages.");
            }

            await Task.Delay(
                TimeSpan.FromSeconds(5),
                stoppingToken);
        }
    }

    private async Task ProcessMessagesAsync(
        CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

        var eventPublisher =
            scope.ServiceProvider.GetRequiredService<IEventPublisher>();

        var messages = await dbContext.OutboxMessages
            .Where(x => x.ProcessedAt == null)
            .OrderBy(x => x.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
        {
            try
            {
                switch (message.EventType)
                {
                    case nameof(PaymentSucceeded):
                        {
                            var paymentSucceeded =
                                JsonSerializer.Deserialize<PaymentSucceeded>(
                                    message.Payload);

                            if (paymentSucceeded is null)
                            {
                                throw new InvalidOperationException(
                                    "Unable to deserialize PaymentSucceeded event.");
                            }

                            await eventPublisher.PublishAsync(paymentSucceeded);

                            break;
                        }

                    default:
                        throw new InvalidOperationException(
                            $"Unsupported outbox event type: {message.EventType}");
                }

                message.ProcessedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync(
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish outbox message {OutboxMessageId}.",
                    message.Id);
            }
        }
    }
}