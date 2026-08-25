using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationService.Domain.Entities;

namespace ReservationService.Infrastructure.Persistence.EntityConfigurations;

public class TennisClubConfiguration : IEntityTypeConfiguration<TennisClub>
{
    public void Configure(EntityTypeBuilder<TennisClub> builder)
    {
        builder.ToTable("tennis_clubs");
        builder.HasKey(w => w.Id);
        builder.Property(c => c.Id).ValueGeneratedNever(); 
        builder.Property(c => c.Name).HasMaxLength(150).IsRequired();
        builder.Property(c => c.OwnerId).IsRequired();
        
        builder.OwnsOne(c => c.Address, address =>
        {
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(50).IsRequired();
            address.Property(a => a.Municipality ).HasColumnName("municipality").HasMaxLength(50);
            address.Property(a => a.ZipCode ).HasColumnName("zip_code").HasMaxLength(20);
            address.Property(a => a.Street ).HasColumnName("street").HasMaxLength(100).IsRequired();
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(50).IsRequired();
            address.Property(a => a.StreetNumber ).HasColumnName("street_number").HasMaxLength(20).IsRequired();
        });
        
        builder.Metadata.FindNavigation(nameof(TennisClub.Courts))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata.FindNavigation(nameof(TennisClub.WorkingHours))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        
        builder.HasMany(c => c.Courts)
            .WithOne(co => co.Club)
            .HasForeignKey(co => co.ClubId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(c => c.WorkingHours)
            .WithOne(w => w.Club)
            .HasForeignKey(w => w.ClubId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}