using Messaging.Events;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using ReservationService.Domain.Interfaces;
using System.Text;
using System.Text.Json;

namespace ReservationService.Infrastructure.Messaging;

public class RabbitMqEventConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;


    public RabbitMqEventConsumer(
                IConfiguration configuration,
                IServiceScopeFactory scopeFactory
        )
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
            UserName = _configuration["RabbitMQ:Username"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest"
        };
        
        Console.WriteLine($"[RabbitMQ] Host: {factory.HostName}");
        Console.WriteLine($"[RabbitMQ] Username: {factory.UserName}");

        var connection = await factory.CreateConnectionAsync(cancellationToken);
        var channel = await connection.CreateChannelAsync(
            cancellationToken: cancellationToken);

        await channel.ExchangeDeclareAsync(
            exchange: "bookyoursport.events",
            type: ExchangeType.Fanout,
            durable: true,
            cancellationToken: cancellationToken);

        var queue = await channel.QueueDeclareAsync(
            queue: "reservation-service",
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: queue.QueueName,
            exchange: "bookyoursport.events",
            routingKey: string.Empty,
            cancellationToken: cancellationToken);

        var consumer = new AsyncEventingBasicConsumer(channel);

        consumer.ReceivedAsync += async (_, args) =>
        {
            try
            {
                var message = Encoding.UTF8.GetString(args.Body.ToArray());

                Console.WriteLine(
                    $"[RabbitMQ] Received event: {message}");

                using var document = JsonDocument.Parse(message);

                var eventType = document.RootElement
                    .GetProperty("EventType")
                    .GetString();

                var data = document.RootElement
                    .GetProperty("Data")
                    .GetRawText();

                using var scope = _scopeFactory.CreateScope();

                var reservationRepository =
                    scope.ServiceProvider.GetRequiredService<IReservationRepository>();

                switch (eventType)
                {
                    case nameof(PaymentSucceeded):
                        {
                            var paymentSucceeded =
                                JsonSerializer.Deserialize<PaymentSucceeded>(data);

                            if (paymentSucceeded is null)
                                throw new InvalidOperationException(
                                    "Could not deserialize PaymentSucceeded event.");

                            var reservation =
                                await reservationRepository.GetByIdAsync(
                                    paymentSucceeded.ReservationId);

                            if (reservation is null)
                                throw new InvalidOperationException(
                                    "Reservation not found.");

                            reservation.Confirm();

                            await reservationRepository.SaveChangesAsync();

                            break;
                        }

                    case nameof(RefundSucceeded):
                        {
                            var refundSucceeded =
                                JsonSerializer.Deserialize<RefundSucceeded>(data);

                            if (refundSucceeded is null)
                                throw new InvalidOperationException(
                                    "Could not deserialize RefundSucceeded event.");

                            var reservation =
                                await reservationRepository.GetByIdAsync(
                                    refundSucceeded.ReservationId);

                            if (reservation is null)
                                throw new InvalidOperationException(
                                    "Reservation not found.");

                            reservation.Cancel();

                            await reservationRepository.SaveChangesAsync();

                            break;
                        }

                    default:
                        throw new InvalidOperationException(
                            $"Unknown event type: {eventType}");
                }

                await channel.BasicAckAsync(
                    args.DeliveryTag,
                    multiple: false,
                    cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[RabbitMQ] Error processing event: {ex.Message}");

                await channel.BasicNackAsync(
                    args.DeliveryTag,
                    multiple: false,
                    requeue: true,
                    cancellationToken: cancellationToken);
            }
        };

        await channel.BasicConsumeAsync(
            queue: queue.QueueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: cancellationToken);

        // Keep the background service alive while RabbitMQ consumer is active.
        await Task.Delay(Timeout.Infinite, cancellationToken);
    }
}