using System.Text.Json;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Persistence.Outbox;

public class OutboxWriter : IOutboxWriter
{
    private readonly PaymentDbContext _dbContext;

    public OutboxWriter(PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public void Add<T>(T eventMessage)
    {
        var message = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventType = typeof(T).Name,
            Payload = JsonSerializer.Serialize(eventMessage),
            CreatedAt = DateTime.UtcNow,
            ProcessedAt = null
        };

        _dbContext.OutboxMessages.Add(message);
    }
}