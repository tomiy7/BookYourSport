using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Contract;
using PaymentService.Domain.Entities;
using PaymentService.Infrastructure.Persistence.Outbox;

namespace PaymentService.Infrastructure.Persistence;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options)
        : base(options)
    {
    }

    public DbSet<CreditAccount> CreditAccounts => Set<CreditAccount>();

    public DbSet<Contract> Contracts => Set<Contract>();

    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all EF Core entity configurations defined in the Infrastructure assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(PaymentDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}