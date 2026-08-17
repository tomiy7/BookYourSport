using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Domain.Entities;

public class TennisClub : AggregateRoot
{
    private readonly List<Court> _courts = new();
    private readonly List<WorkingHours> _workingHours = new();
    
    public string Name { get; private set; } = string.Empty;
    public Guid OwnerId { get; private set; }
    public string? Description { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? EmailAddress { get; private set; }
    public Address Address { get; private set; } = null!;
    public bool IsActive { get; private set; }
    
    public IReadOnlyCollection<Court> Courts => _courts.AsReadOnly();
    public IReadOnlyCollection<WorkingHours> WorkingHours => _workingHours.AsReadOnly();
    
    private TennisClub() { }

    private TennisClub(string name, Guid ownerId, string? description, string? phoneNumber, string? emailAddress,
        Address address)
    {
        Id = Guid.NewGuid();
        Name = name;
        OwnerId = ownerId;
        Description = description;
        PhoneNumber = phoneNumber;
        EmailAddress = emailAddress;
        Address = address;
        IsActive = true;
    }

    public static TennisClub Create(string name, Guid ownerId, string? description, string? phoneNumber,
        string? emailAddress, Address address)
    {
        if (ownerId == Guid.Empty)
            throw new ReservationDomainException("Club must have an owner.");
        if (string.IsNullOrWhiteSpace(name))
            throw new ReservationDomainException("Name of the club is mandatory.");

        return new TennisClub(name.Trim(), ownerId, description, phoneNumber, emailAddress, address);
    }

    public void UpdateDetails(string name, string? description, string? phoneNumber, string? emailAddress,
        Address address)
    {
        Name = name.Trim();
        Description = description;
        PhoneNumber = phoneNumber;
        EmailAddress = emailAddress;
        Address = address;
    }
    
    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
    
    public Court AddCourt(string name, Domain.Enums.SurfaceType surfaceType, bool isIndoor, Price pricePerHour)
    {
        if (!IsActive)
            throw new ReservationDomainException("Can not add court to an inactive club.");

        if (_courts.Any(c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
            throw new ReservationDomainException($"Court with name '{name}' already exists in this club.");

        var court = Court.Create(Id, name, surfaceType, isIndoor, pricePerHour);
        _courts.Add(court);
        return court;
    }

    public void RemoveCourt(Guid courtId)
    {
        var court = _courts.FirstOrDefault(c => c.Id == courtId);
        if (court == null)
            throw new ReservationDomainException($"Court with id '{courtId}' does not exist in this club.");

        _courts.Remove(court);
    }

    public void SetWorkingHours(DayOfWeek day, TimeOnly openTime, TimeOnly closeTime, bool isClosed = false)
    {
        if (!isClosed && openTime >= closeTime)
            throw new ReservationDomainException("Time of opening must be before the time of closing.");

        var existing = _workingHours.FirstOrDefault(w => w.DayOfWeek == day);
        if (existing != null)
        {
            existing.Update(openTime, closeTime, isClosed);
        }
        else
        {
            _workingHours.Add(Entities.WorkingHours.Create(Id, day, openTime, closeTime, isClosed));
        }
    }

    public bool IsOpenAt(DateTime dateTime)
    {
        var hours = _workingHours.FirstOrDefault(w => w.DayOfWeek == dateTime.DayOfWeek);
        if (hours == null || hours.IsClosed) return false;

        var time = TimeOnly.FromDateTime(dateTime);
        return time >= hours.OpenTime && time <= hours.CloseTime;
    }
}