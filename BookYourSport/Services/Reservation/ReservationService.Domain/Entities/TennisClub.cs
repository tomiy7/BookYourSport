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
    
    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}