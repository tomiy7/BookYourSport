using ReservationService.Domain.Common;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;

namespace ReservationService.Domain.Entities;

public class Reservation : AggregateRoot
{
    private static readonly TimeSpan MinDuration = TimeSpan.FromHours(1);
    private static readonly TimeSpan MaxDuration = TimeSpan.FromHours(4);
    
    public Guid CourtId { get; private set; }
    public Guid ClubId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public Price Price { get; private set; } = null!;
    public ReservationStatus Status { get; private set; }
    
    private Reservation() { }

    private Reservation(Guid courtId, Guid clubId, Guid userId, DateTime startTime, DateTime endTime, Price price)
    {
        Id = Guid.NewGuid();
        CourtId = courtId;
        ClubId = clubId;
        UserId = userId;
        StartTime = startTime;
        EndTime = endTime;
        Price = price;
        Status = ReservationStatus.Pending;
    }

    public static Reservation Create(Guid courtId, Guid clubId, Guid userId, DateTime startTime, DateTime endTime,
        Price price)
    {
        if (userId == Guid.Empty)
            throw new ReservationDomainException("Reservation must have a user.");
        ValidateTimeRange(startTime, endTime);
        
        return new Reservation(courtId, clubId, userId, startTime, endTime, price);
    }

    // logic will be changed once this connects with payment service
    public void Confirm()
    {
        if (Status != ReservationStatus.Pending)     
            throw new ReservationDomainException("Only pending reservations can be confirmed.");
        
        Status = ReservationStatus.Confirmed;
    }

    public void Cancel()
    {
        if (Status == ReservationStatus.Cancelled)
            throw new ReservationDomainException("Reservation is already cancelled.");
        
        Status = ReservationStatus.Cancelled;
    }
    
    // For now only supports the rescheduling with the same duration of the slot
    // Will be changed once we align on the approach
    public void Reschedule(DateTime newStartTime, DateTime newEndTime)
    {
        if (Status == ReservationStatus.Cancelled)
            throw new ReservationDomainException("Cannot reschedule a cancelled reservation.");
        
        ValidateTimeRange(newStartTime, newEndTime);
        
        var originalDuration = EndTime - StartTime;
        var newDuration = newEndTime - newStartTime;
        if (newDuration != originalDuration)
            throw new ReservationDomainException("Rescheduling can not change the reservation duration.");
        
        StartTime = newStartTime;
        EndTime = newEndTime;
    }
    
    private static void ValidateTimeRange(DateTime startTime, DateTime endTime)
    {
        if (startTime >= endTime)
            throw new ReservationDomainException("Start time must be before end time.");
        if (startTime < DateTime.UtcNow)
            throw new ReservationDomainException("Can not book a reservation in the past.");
        
        var duration = endTime - startTime;
        
        if (duration < MinDuration)
            throw new ReservationDomainException($"Reservation must be at least {MinDuration.TotalHours} hour(s) long.");
        if (duration > MaxDuration)
            throw new ReservationDomainException($"Reservation can not be longer than {MaxDuration.TotalHours} hours.");
        if (duration.Ticks % MinDuration.Ticks != 0)
            throw new ReservationDomainException("Reservation duration must be a whole number of hours.");
        if (startTime.Minute != 0 || startTime.Second != 0)
            throw new ReservationDomainException("Reservation must start at the top of the hour.");
    }
}