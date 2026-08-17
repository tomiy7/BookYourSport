using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationService.Domain.Entities;

namespace ReservationService.Infrastructure.Persistence.EntityConfigurations;

public class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> builder)
    {
        builder.ToTable("courts");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever(); 
        builder.Property(c => c.Name).HasMaxLength(50).IsRequired();
        builder.Property(c => c.SurfaceType).HasConversion<string>().HasMaxLength(10);

        builder.OwnsOne(c => c.PricePerHour, price =>
        {
            price.Property(p => p.Amount).HasColumnName("price_amount").HasColumnType("decimal(10,2)").IsRequired();
            price.Property(p => p.Currency).HasColumnName("price_currency").HasMaxLength(3).IsRequired();
        });
    }
}