using ReservationService.Domain.Common;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Domain.Entities;

public class Court : Entity
{
    public Guid ClubId { get; private set; }
    public TennisClub? Club { get; private set; }
    
    public string Name { get; private set; } = string.Empty;
    public SurfaceType SurfaceType { get; private set; }
    public bool IsIndoor { get; private set; }
    public Price PricePerHour { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;
    
    private Court () { }

    private Court(Guid clubId, string name, SurfaceType surfaceType, bool isIndoor, Price pricePerHour)
    {
        Id = Guid.NewGuid();
        ClubId = clubId;
        Name = name;
        SurfaceType =  surfaceType;
        IsIndoor = isIndoor;
        PricePerHour = pricePerHour;
        IsActive = true;
    }

    internal static Court Create(Guid clubId, string name, SurfaceType surfaceType, bool isIndoor, Price pricePerHour)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ReservationDomainException("Name of the court is mandatory.");

        return new Court(clubId, name.Trim(), surfaceType, isIndoor, pricePerHour);
    }

    public void UpdateDetails(string name, SurfaceType surfaceType, bool isIndoor, Price pricePerHour)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ReservationDomainException("Name of the court is mandatory.");
        
        Name = name.Trim();
        SurfaceType = surfaceType;
        IsIndoor = isIndoor;
        PricePerHour = pricePerHour;
    }
    
    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}