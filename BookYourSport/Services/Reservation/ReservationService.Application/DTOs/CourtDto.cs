using ReservationService.Domain.Enums;

namespace ReservationService.Application.DTOs;

public class PriceDto
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "RSD";
}

public class CourtDto
{
    public Guid Id { get; set; }
    public Guid ClubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public SurfaceType SurfaceType { get; set; }
    public bool IsIndoor { get; set; }
    public PriceDto PricePerHour { get; set; } = new();
    public bool IsActive { get; set; }
}