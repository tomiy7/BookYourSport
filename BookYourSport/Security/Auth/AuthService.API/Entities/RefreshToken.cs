using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.API.Entities;

[Table("refresh_tokens")]
public class RefreshToken
{
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("revoked_at")]
    public DateTime? RevokedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public bool IsActive =>
        RevokedAt == null && ExpiresAt > DateTime.UtcNow;
}