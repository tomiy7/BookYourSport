using System.ComponentModel.DataAnnotations;

namespace ReservationService.Application.DTOs;

public class ReservationDto
{
    public Guid Id { get; set; }
    public Guid CourtId { get; set; }
    public Guid ClubId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public PriceDto Price { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

public class CreateReservationDto
{
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public DateTime StartTime { get; set; }
    
    [Required]
    public DateTime EndTime { get; set; }
}

public class RescueReservationDto
{
    [Required]
    public DateTime NewStartTime { get; set; }
    
    [Required]
    public DateTime NewEndTime { get; set; }
}