using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Persistence.Configurations;

public class CreditAccountConfiguration : IEntityTypeConfiguration<CreditAccount>
{
    public void Configure(EntityTypeBuilder<CreditAccount> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.Balance)
            .IsRequired();

        builder.HasMany(x => x.Transactions)
            .WithOne()
            .HasForeignKey("CreditAccountId")
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
    }
}