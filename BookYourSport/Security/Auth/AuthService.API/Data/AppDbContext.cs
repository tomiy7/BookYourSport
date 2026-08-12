using AuthService.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Users_Role",
                $"role IN ('{Roles.Player}', '{Roles.Club}', '{Roles.Admin}')"
            ));
    }
}