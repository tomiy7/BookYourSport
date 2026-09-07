using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.Domain.Entities;

public class WorkingHours : Entity
{
    public Guid ClubId { get; private set; }
    public TennisClub? Club { get; private set; }

    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly OpenTime { get; private set; }
    public TimeOnly CloseTime { get; private set; }
    public bool IsClosed { get; private set; }

    private WorkingHours() { }

    private WorkingHours(Guid clubId, DayOfWeek dayOfWeek, TimeOnly openTime, TimeOnly closeTime, bool isClosed)
    {
        Id = Guid.NewGuid();
        ClubId = clubId;
        DayOfWeek = dayOfWeek;
        OpenTime = openTime;
        CloseTime = closeTime;
        IsClosed = isClosed;
    }

    internal static WorkingHours Create(Guid clubId, DayOfWeek dayOfWeek, TimeOnly openTime, TimeOnly closeTime, bool isClosed)
    {
        if (!isClosed && openTime >= closeTime)
            throw new ReservationDomainException("Time of opening must be before the time of closing.");

        return new WorkingHours(clubId, dayOfWeek, openTime, closeTime, isClosed);
    }

    internal void Update(TimeOnly openTime, TimeOnly closeTime, bool isClosed)
    {
        if (!isClosed && openTime >= closeTime)
            throw new ReservationDomainException("Time of opening must be before the time of closing.");

        OpenTime = openTime;
        CloseTime = closeTime;
        IsClosed = isClosed;
    }
}