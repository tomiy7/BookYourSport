namespace AuthService.API.DTOs;

public class UserResponseDto
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public DateOnly DateOfBirth { get; set; }

    public string Role { get; set; } = string.Empty;
}