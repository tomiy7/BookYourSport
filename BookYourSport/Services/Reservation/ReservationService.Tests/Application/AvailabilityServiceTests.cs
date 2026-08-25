using Microsoft.Extensions.Logging.Abstractions;
using ReservationService.Application.Services;
using ReservationService.Tests.Fakes;
using ReservationService.Tests.TestHelpers;
using Xunit;

namespace ReservationService.Tests.Application;

public class AvailabilityServiceTests
{
    private readonly FakeClubRepository _clubRepository = new();
    private readonly FakeReservationRepository _reservationRepository = new();
    private readonly AvailabilityService _sut;

    public AvailabilityServiceTests()
    {
        _sut = new AvailabilityService(
            _clubRepository,
            _reservationRepository,
            NullLogger<AvailabilityService>.Instance);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_NonExistentClub_ReturnsNull()
    {
        var result = await _sut.GetAvailableSlotsAsync(Guid.NewGuid(), Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow));

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ClubClosedThatDay_ReturnsEmptyList()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);
        
        var monday = TestData.NextMondayAt(9);
        club.SetWorkingHours(DayOfWeek.Monday, new TimeOnly(7, 0), new TimeOnly(22, 0), isClosed: true);

        var result = await _sut.GetAvailableSlotsAsync(club.Id, court.Id, DateOnly.FromDateTime(monday));

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_NoExistingReservations_ReturnsFullWorkingHoursAsSlots()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var monday = TestData.NextMondayAt(9);
        var result = await _sut.GetAvailableSlotsAsync(club.Id, court.Id, DateOnly.FromDateTime(monday));

        Assert.Equal(15, result!.Count);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_WithExistingReservation_ExcludesThatSlot()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var monday = TestData.NextMondayAt(9);
        var reservation = ReservationService.Domain.Entities.Reservation.Create(
            court.Id, club.Id, Guid.NewGuid(), monday, monday.AddHours(1),
            ReservationService.Domain.ValueObjects.Price.Create(1500m));
        _reservationRepository.Seed(reservation);

        var result = await _sut.GetAvailableSlotsAsync(club.Id, court.Id, DateOnly.FromDateTime(monday));

        Assert.DoesNotContain(result!, slot => slot.StartTime == monday);
        Assert.Equal(14, result!.Count); 
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_InactiveCourt_ReturnsEmptyList()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        court.Deactivate();
        _clubRepository.Seed(club);

        var monday = TestData.NextMondayAt(9);
        var result = await _sut.GetAvailableSlotsAsync(club.Id, court.Id, DateOnly.FromDateTime(monday));

        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
