using System.ComponentModel.DataAnnotations;

namespace AuthService.API.DTOs;

public class UpdateProfileRequestDto
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    public DateOnly DateOfBirth { get; set; }
}