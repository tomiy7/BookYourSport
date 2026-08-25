using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;
using ReservationService.Tests.TestHelpers;
using Xunit;

namespace ReservationService.Tests.Domain;

public class TennisClubTests
{
    [Fact]
    public void Create_WithValidData_Succeeds()
    {
        var ownerId = Guid.NewGuid();
        var club = TennisClub.Create("Klub", ownerId, "Opis", "011-123", "a@b.rs", TestData.ValidAddress());

        Assert.Equal("Klub", club.Name);
        Assert.Equal(ownerId, club.OwnerId);
        Assert.True(club.IsActive);
        Assert.Empty(club.Courts);
    }

    [Fact]
    public void Create_WithEmptyOwnerId_Throws()
    {
        Assert.Throws<ReservationDomainException>(() =>
            TennisClub.Create("Klub", Guid.Empty, null, null, null, TestData.ValidAddress()));
    }

    [Fact]
    public void Create_WithEmptyName_Throws()
    {
        Assert.Throws<ReservationDomainException>(() =>
            TennisClub.Create("   ", Guid.NewGuid(), null, null, null, TestData.ValidAddress()));
    }

    [Fact]
    public void AddCourt_ToActiveClub_Succeeds()
    {
        var club = TestData.ActiveClub();

        var court = club.AddCourt("Teren 1", SurfaceType.Clay, isIndoor: false, Price.Create(1500m));

        Assert.Single(club.Courts);
        Assert.Equal(court.Id, club.Courts.First().Id);
    }

    [Fact]
    public void AddCourt_DuplicateNameInSameClub_Throws()
    {
        var club = TestData.ActiveClub();
        club.AddCourt("Teren 1", SurfaceType.Clay, isIndoor: false, Price.Create(1500m));

        Assert.Throws<ReservationDomainException>(() =>
            club.AddCourt("teren 1", SurfaceType.Hard, isIndoor: true, Price.Create(2000m)));
    }

    [Fact]
    public void AddCourt_ToInactiveClub_Throws()
    {
        var club = TestData.ActiveClub();
        club.Deactivate();

        Assert.Throws<ReservationDomainException>(() =>
            club.AddCourt("Teren 1", SurfaceType.Clay, isIndoor: false, Price.Create(1500m)));
    }

    [Fact]
    public void RemoveCourt_ExistingCourt_RemovesIt()
    {
        var club = TestData.ActiveClub();
        var court = club.AddCourt("Teren 1", SurfaceType.Clay, isIndoor: false, Price.Create(1500m));

        club.RemoveCourt(court.Id);

        Assert.Empty(club.Courts);
    }

    [Fact]
    public void RemoveCourt_NonExistentCourt_Throws()
    {
        var club = TestData.ActiveClub();

        Assert.Throws<ReservationDomainException>(() => club.RemoveCourt(Guid.NewGuid()));
    }

    [Fact]
    public void SetWorkingHours_NewDay_AddsEntry()
    {
        var club = TennisClub.Create("Klub", Guid.NewGuid(), null, null, null, TestData.ValidAddress());

        club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(7, 0), new TimeOnly(22, 0));

        Assert.Single(club.WorkingHours);
    }

    [Fact]
    public void SetWorkingHours_ExistingDay_UpdatesInsteadOfDuplicating()
    {
        var club = TennisClub.Create("Klub", Guid.NewGuid(), null, null, null, TestData.ValidAddress());
        club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(7, 0), new TimeOnly(22, 0));

        club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(20, 0));

        Assert.Single(club.WorkingHours);
        Assert.Equal(new TimeOnly(8, 0), club.WorkingHours.First().OpenTime);
    }

    [Fact]
    public void SetWorkingHours_OpenAfterClose_Throws()
    {
        var club = TennisClub.Create("Klub", Guid.NewGuid(), null, null, null, TestData.ValidAddress());

        Assert.Throws<ReservationDomainException>(() =>
            club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(22, 0), new TimeOnly(7, 0)));
    }

    [Fact]
    public void IsOpenDuring_FullyWithinWorkingHours_ReturnsTrue()
    {
        var club = TestData.ActiveClub(); // 07:00-22:00 svaki dan
        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(2);

        Assert.True(club.IsOpenDuring(start, end));
    }

    [Fact]
    public void IsOpenDuring_EndsAfterClosing_ReturnsFalse()
    {
        var club = TestData.ActiveClub();
        var start = TestData.NextMondayAt(21);
        var end = start.AddHours(2);

        Assert.False(club.IsOpenDuring(start, end));
    }

    [Fact]
    public void IsOpenDuring_StartsBeforeOpening_ReturnsFalse()
    {
        var club = TestData.ActiveClub(); // otvara u 07:00
        var start = TestData.NextMondayAt(6);
        var end = start.AddHours(1);

        Assert.False(club.IsOpenDuring(start, end));
    }

    [Fact]
    public void IsOpenDuring_ClubClosedThatDay_ReturnsFalse()
    {
        var club = TennisClub.Create("Klub", Guid.NewGuid(), null, null, null, TestData.ValidAddress());
        club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(7, 0), new TimeOnly(22, 0), isClosed: true);

        var start = TestData.NextMondayAt(9);
        var end = start.AddHours(1);

        Assert.False(club.IsOpenDuring(start, end));
    }
}
