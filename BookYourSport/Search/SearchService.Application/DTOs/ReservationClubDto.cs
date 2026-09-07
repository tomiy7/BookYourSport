using SearchService.Domain.Enums;

namespace SearchService.Application.DTOs;

public class ReservationClubDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ReservationAddressDto Address { get; set; } = new();

    public List<ReservationCourtDto> Courts { get; set; } = new();
    public List<ReservationWorkingHoursDto> WorkingHours { get; set; } = new();
}

public class ReservationAddressDto
{
    public string City { get; set; } = string.Empty;
    public string? Municipality { get; set; }
    public string? ZipCode { get; set; }
    public string Street { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string StreetNumber { get; set; } = string.Empty;
}

public class ReservationCourtDto
{
    public Guid Id { get; set; }
    public Guid ClubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public SurfaceType SurfaceType { get; set; }
    public bool IsIndoor { get; set; }
    public ReservationPriceDto PricePerHour { get; set; } = new();
    public bool IsActive { get; set; }
}

public class ReservationPriceDto
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "RSD";
}

public class ReservationWorkingHoursDto
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
    public bool IsClosed { get; set; }
}