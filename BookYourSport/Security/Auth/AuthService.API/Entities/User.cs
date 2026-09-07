using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.API.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("city")]
    public string City { get; set; } = string.Empty;

    [Required]
    [Column("date_of_birth")]
    public DateOnly DateOfBirth { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = Roles.Player;

    [Required]
    [MaxLength(30)]
    [Column("approval_status")]
    public string ApprovalStatus { get; set; } =
        ApprovalStatuses.NotRequested;

    [Required]
    [MaxLength(30)]
    [Column("contract_status")]
    public string ContractStatus { get; set; } =
        ContractStatuses.NotGenerated;

    [Required]
    [MaxLength(30)]
    [Column("subscription_status")]
    public string SubscriptionStatus { get; set; } =
        SubscriptionStatuses.NotStarted;
}