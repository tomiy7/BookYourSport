using PaymentService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace PaymentService.Infrastructure.Persistence;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options)
        : base(options)
    {
    }

    public DbSet<CreditAccount> CreditAccounts => Set<CreditAccount>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(PaymentDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}