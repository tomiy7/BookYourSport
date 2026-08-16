using System.ComponentModel.DataAnnotations;

namespace AuthService.API.DTOs;

public class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}