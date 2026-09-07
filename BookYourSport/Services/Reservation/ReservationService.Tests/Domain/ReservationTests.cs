using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;
using ReservationService.Tests.TestHelpers;
using Xunit;

namespace ReservationService.Tests.Domain;

public class ReservationTests
{
    private static readonly Guid CourtId = Guid.NewGuid();
    private static readonly Guid ClubId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Price OneHourPrice = Price.Create(1500m);

    [Fact]
    public void Create_WithValidOneHourSlot_Succeeds()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(1);

        var reservation = Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice);

        Assert.Equal(ReservationStatus.Pending, reservation.Status);
        Assert.Equal(start, reservation.StartTime);
        Assert.Equal(end, reservation.EndTime);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(4)]
    public void Create_WithAllowedDurations_Succeeds(int hours)
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(hours);

        var reservation = Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice);

        Assert.Equal(TimeSpan.FromHours(hours), reservation.EndTime - reservation.StartTime);
    }

    [Fact]
    public void Create_LongerThanMaxDuration_Throws()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(5); 

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_ShorterThanMinDuration_Throws()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddMinutes(30); 

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_DurationNotWholeHours_Throws()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(1).AddMinutes(37);

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_NotStartingOnTheHour_Throws()
    {
        var start = TestData.NextMondayAt(9).AddMinutes(15);
        var end = start.AddHours(1);

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_InThePast_Throws()
    {
        var start = DateTime.UtcNow.AddDays(-1);
        var end = start.AddHours(1);

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_EndBeforeStart_Throws()
    {
        var start = TestData.NextMondayAt(10);
        var end = TestData.NextMondayAt(9);

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice));
    }

    [Fact]
    public void Create_WithEmptyUserId_Throws()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(1);

        Assert.Throws<ReservationDomainException>(() =>
            Reservation.Create(CourtId, ClubId, Guid.Empty, start, end, OneHourPrice));
    }

    [Fact]
    public void Confirm_FromPending_SetsStatusToConfirmed()
    {
        var reservation = CreateValidReservation();

        reservation.Confirm();

        Assert.Equal(ReservationStatus.Confirmed, reservation.Status);
    }

    [Fact]
    public void Confirm_AlreadyConfirmed_Throws()
    {
        var reservation = CreateValidReservation();
        reservation.Confirm();

        Assert.Throws<ReservationDomainException>(() => reservation.Confirm());
    }

    [Fact]
    public void Cancel_FromConfirmed_SetsStatusToCancelled()
    {
        var reservation = CreateValidReservation();
        reservation.Confirm();

        reservation.Cancel();

        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
    }

    [Fact]
    public void Cancel_AlreadyCancelled_Throws()
    {
        var reservation = CreateValidReservation();
        reservation.Cancel();

        Assert.Throws<ReservationDomainException>(() => reservation.Cancel());
    }

    [Fact]
    public void Reschedule_ToValidSlot_UpdatesTimesAndPrice()
    {
        var reservation = CreateValidReservation();
        var newStart = TestData.NextMondayAt(14);
        var newEnd = newStart.AddHours(2);
        var newPrice = Price.Create(3000m);

        reservation.Reschedule(newStart, newEnd, newPrice);

        Assert.Equal(newStart, reservation.StartTime);
        Assert.Equal(newEnd, reservation.EndTime);
        Assert.Equal(3000m, reservation.Price.Amount);
    }

    [Fact]
    public void Reschedule_CancelledReservation_Throws()
    {
        var reservation = CreateValidReservation();
        reservation.Cancel();

        var newStart = TestData.NextMondayAt(14);
        var newEnd = newStart.AddHours(1);

        Assert.Throws<ReservationDomainException>(() =>
            reservation.Reschedule(newStart, newEnd, OneHourPrice));
    }

    [Fact]
    public void Reschedule_InvalidDuration_Throws()
    {
        var reservation = CreateValidReservation();
        var newStart = TestData.NextMondayAt(14);
        var newEnd = newStart.AddMinutes(20);

        Assert.Throws<ReservationDomainException>(() =>
            reservation.Reschedule(newStart, newEnd, OneHourPrice));
    }

    private static Reservation CreateValidReservation()
    {
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(1);
        return Reservation.Create(CourtId, ClubId, UserId, start, end, OneHourPrice);
    }
}
