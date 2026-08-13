using Microsoft.EntityFrameworkCore;
using ReservationService.Domain.Common;
using ReservationService.Domain.Entities;
using ReservationService.Infrastructure.Persistence.EntityConfigurations;

namespace ReservationService.Infrastructure.Data;

public class ReservationDbContext : DbContext
{
    public ReservationDbContext(DbContextOptions<ReservationDbContext> options)
        : base(options) { }
    
    public DbSet<TennisClub> TennisClubs => Set<TennisClub>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedDate = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.LastModifiedDate = DateTime.UtcNow;
                    break;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new TennisClubConfiguration());
        modelBuilder.ApplyConfiguration(new CourtConfiguration());
        modelBuilder.ApplyConfiguration(new WorkingHoursConfiguration());
        
        base.OnModelCreating(modelBuilder);
    }
}