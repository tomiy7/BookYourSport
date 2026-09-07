using System.ComponentModel.DataAnnotations;

namespace AuthService.API.DTOs;

public class UpdateUserRoleRequestDto
{
    [Required]
    public string Role { get; set; } = string.Empty;
}