using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationService.Domain.Entities;

namespace ReservationService.Infrastructure.Persistence.EntityConfigurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("reservations");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
        
        builder.OwnsOne(r => r.Price, price =>
        {
            price.Property(p => p.Amount).HasColumnName("price_amount").HasColumnType("decimal(10,2)").IsRequired();
            price.Property(p => p.Currency).HasColumnName("price_currency").HasMaxLength(3).IsRequired();
        });
        
        // in the project won't cover on the database level the overlap where 
        // fe. someone wants a slot from 10:00-12:00 and another person from 11:00-12:00
        // on the database level it is allowed, but it will be covered if the repository
        builder.HasIndex(r => new { r.CourtId, r.StartTime }).IsUnique();
        
        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => r.ClubId);
    }
}