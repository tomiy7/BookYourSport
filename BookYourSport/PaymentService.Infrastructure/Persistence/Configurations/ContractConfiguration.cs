using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain.Contract;

namespace PaymentService.Infrastructure.Persistence.Configurations;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("Contracts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.DocumentPath)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.SignedAt);
    }
}