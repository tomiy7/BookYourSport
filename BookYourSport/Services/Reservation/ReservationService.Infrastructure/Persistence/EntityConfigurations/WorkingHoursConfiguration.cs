using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationService.Domain.Entities;

namespace ReservationService.Infrastructure.Persistence.EntityConfigurations;

public class WorkingHoursConfiguration : IEntityTypeConfiguration<WorkingHours>
{
    public void Configure(EntityTypeBuilder<WorkingHours> builder)
    {
        builder.ToTable("working_hours");
        builder.HasKey(x => x.Id);
        builder.Property(w => w.Id).ValueGeneratedNever();
        builder.Property(w => w.DayOfWeek).HasConversion<string>().HasMaxLength(15);
        
        builder.HasIndex(w => new { w.ClubId, w.DayOfWeek }).IsUnique();
    }
}