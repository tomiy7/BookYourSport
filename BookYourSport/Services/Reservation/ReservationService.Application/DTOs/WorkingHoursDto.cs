using System.ComponentModel.DataAnnotations;

namespace ReservationService.Application.DTOs;

public class WorkingHoursDto
{
    public Guid Id { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
    public bool IsClosed { get; set; }
}

public class CreateWorkingHoursDto
{
    [Required]
    public DayOfWeek DayOfWeek { get; set; }
    
    [Required]
    public TimeOnly OpenTime { get; set; }
    
    [Required]
    public TimeOnly CloseTime { get; set; }

    public bool IsClosed { get; set; } = false;
}