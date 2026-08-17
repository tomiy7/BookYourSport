using System.ComponentModel.DataAnnotations;

namespace ReservationService.Application.DTOs;


public class AddressDto
{
    public string City { get; set; } = string.Empty;
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string Street { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string StreetNumber { get; set; } = string.Empty;
}

public class ClubDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string? Description { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmailAddress { get; set; }
    public AddressDto Address { get; set; } = new();
    public bool IsActive { get; set; }
    public List<WorkingHoursDto> WorkingHours { get; set; } = new();
    public List<CourtDto> Courts { get; set; } = new();
}

public class CreateClubDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public Guid OwnerId { get; set; }
    
    public string? Description { get; set; }
    
    [Phone]
    public string? PhoneNumber { get; set; }
    
    [EmailAddress]
    public string? EmailAddress { get; set; }
    
    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;
    
    public string? State { get; set; }
    
    public string? ZipCode { get; set; }
    
    [Required, MaxLength(150)]
    public string Street { get; set; } = string.Empty;
    
    [Required, MaxLength(100)]
    public string Country { get; set; } = string.Empty;
    
    [Required, MaxLength(20)]
    public string StreetNumber { get; set; } = string.Empty;
    
    public List<CreateWorkingHoursDto>? WorkingHours { get; set; }
}

public class UpdateClubDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Phone]
    public string? PhoneNumber { get; set; }
    
    [EmailAddress]
    public string? EmailAddress { get; set; }
    
    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;
    
    public string? State { get; set; }
    
    public string? ZipCode { get; set; }
    
    [Required, MaxLength(150)]
    public string Street { get; set; } = string.Empty;
    
    [Required, MaxLength(100)]
    public string Country { get; set; } = string.Empty;
    
    [Required, MaxLength(20)]
    public string StreetNumber { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
}