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

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Users_Role",
                $"role IN (" +
                $"'{Roles.Player}', " +
                $"'{Roles.Club}', " +
                $"'{Roles.Admin}')"
            ));

        modelBuilder.Entity<User>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Users_ApprovalStatus",
                $"approval_status IN (" +
                $"'{ApprovalStatuses.NotRequested}', " +
                $"'{ApprovalStatuses.Requested}', " +
                $"'{ApprovalStatuses.Approved}', " +
                $"'{ApprovalStatuses.Rejected}')"
            ));

        modelBuilder.Entity<User>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Users_ContractStatus",
                $"contract_status IN (" +
                $"'{ContractStatuses.NotGenerated}', " +
                $"'{ContractStatuses.Generated}', " +
                $"'{ContractStatuses.Signed}')"
            ));

        modelBuilder.Entity<User>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Users_SubscriptionStatus",
                $"subscription_status IN (" +
                $"'{SubscriptionStatuses.NotStarted}', " +
                $"'{SubscriptionStatuses.Pending}', " +
                $"'{SubscriptionStatuses.Paid}', " +
                $"'{SubscriptionStatuses.Failed}')"
            ));

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.Token)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}