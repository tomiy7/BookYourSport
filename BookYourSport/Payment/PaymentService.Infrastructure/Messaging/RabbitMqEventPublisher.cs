using System.Text;
using System.Text.Json;
using Messaging.Interfaces;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;

namespace PaymentService.Infrastructure.Messaging;

public class RabbitMqEventPublisher : IEventPublisher
{
    private readonly IConfiguration _configuration;

    public RabbitMqEventPublisher(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task PublishAsync<T>(T @event)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
            UserName = _configuration["RabbitMQ:Username"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest"
        };

        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.ExchangeDeclareAsync(
            exchange: "bookyoursport.events",
            type: ExchangeType.Fanout,
            durable: true);

        var eventName = typeof(T).Name;

        var body = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(new
            {
                EventType = eventName,
                Data = @event
            }));

        await channel.BasicPublishAsync(
            exchange: "bookyoursport.events",
            routingKey: eventName,
            body: body);
    }
}