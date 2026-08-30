using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using ReservationService.Application.DTOs;
using ReservationService.Application.Services;
using ReservationService.Domain.Exceptions;
using ReservationService.Tests.Fakes;
using ReservationService.Tests.TestHelpers;
using Xunit;

namespace ReservationService.Tests.Application;

public class ReservationBookingServiceTests
{
    private readonly FakeClubRepository _clubRepository = new();
    private readonly FakeReservationRepository _reservationRepository = new();
    private readonly ReservationBookingService _sut;
    private readonly FakePaymentServiceClient _paymentServiceClient = new();
    
    public ReservationBookingServiceTests()
    {
        _sut = new ReservationBookingService(
            _clubRepository,
            _reservationRepository,
            NullLogger<ReservationBookingService>.Instance,
            _paymentServiceClient);

    }

    [Fact]
    public async Task CreateReservationAsync_ValidSlot_ReturnsPendingReservation()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club, price: 1500m);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };

        var result = await _sut.CreateReservationAsync(club.Id, court.Id, dto);

        Assert.NotNull(result);
        Assert.Equal("Pending", result!.Status);
        Assert.Equal(1500m, result.Price.Amount);
    }

    [Fact]
    public async Task CreateReservationAsync_TwoHours_ChargesDoubleThePricePerHour()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club, price: 1500m);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(2) };

        var result = await _sut.CreateReservationAsync(club.Id, court.Id, dto);

        Assert.Equal(3000m, result!.Price.Amount);
    }

    [Fact]
    public async Task CreateReservationAsync_NonExistentClub_ReturnsNull()
    {
        var dto = new CreateReservationDto
        {
            UserId = Guid.NewGuid(),
            StartTime = TestData.NextMondayAt(9),
            EndTime = TestData.NextMondayAt(10)
        };

        var result = await _sut.CreateReservationAsync(Guid.NewGuid(), Guid.NewGuid(), dto);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateReservationAsync_OverlappingSlot_ThrowsDomainException()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var firstDto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };
        await _sut.CreateReservationAsync(club.Id, court.Id, firstDto);
        
        var secondDto = new CreateReservationDto
        {
            UserId = Guid.NewGuid(),
            StartTime = start.AddMinutes(30),
            EndTime = start.AddMinutes(90)
        };

        await Assert.ThrowsAsync<ReservationDomainException>(() =>
            _sut.CreateReservationAsync(club.Id, court.Id, secondDto));
    }

    [Fact]
    public async Task CreateReservationAsync_RaceConditionAtDbLevel_ThrowsCleanDomainException()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);
        
        _reservationRepository.SimulateUniqueConstraintViolationOnNextSave = true;

        var start = TestData.NextMondayAt(9);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };

        var ex = await Assert.ThrowsAsync<ReservationDomainException>(() =>
            _sut.CreateReservationAsync(club.Id, court.Id, dto));

        Assert.Contains("Could not create reservation", ex.Message);
    }

    [Fact]
    public async Task CreateReservationAsync_InactiveClub_ThrowsDomainException()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        club.Deactivate();
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };

        await Assert.ThrowsAsync<ReservationDomainException>(() =>
            _sut.CreateReservationAsync(club.Id, court.Id, dto));
    }

    [Fact]
    public async Task CreateReservationAsync_OutsideWorkingHours_ThrowsDomainException()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(21);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(2) };

        await Assert.ThrowsAsync<ReservationDomainException>(() =>
            _sut.CreateReservationAsync(club.Id, court.Id, dto));
    }

    [Fact]
    public async Task RescheduleReservationAsync_ToDifferentDuration_RecalculatesPrice()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club, price: 1500m);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var createDto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };
        var created = await _sut.CreateReservationAsync(club.Id, court.Id, createDto);

        var newStart = TestData.NextMondayAt(14);
        var rescheduleDto = new RescheduleReservationDto { NewStartTime = newStart, NewEndTime = newStart.AddHours(2) };

        var result = await _sut.RescheduleReservationAsync(created!.Id, rescheduleDto);

        Assert.Equal(3000m, result!.Price.Amount);
    }

    [Fact]
    public async Task CancelReservationAsync_ExistingReservation_RequestsRefund()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);

        var createDto = new CreateReservationDto
        {
            UserId = Guid.NewGuid(),
            StartTime = start,
            EndTime = start.AddHours(1)
        };

        var created = await _sut.CreateReservationAsync(
            club.Id,
            court.Id,
            createDto);

        var result = await _sut.CancelReservationAsync(created!.Id);

        Assert.True(result);
        Assert.True(_paymentServiceClient.RefundCalled);
        Assert.Equal(created.Id, _paymentServiceClient.LastReservationId);
    }

    [Fact]
    public async Task CancelReservationAsync_NonExistentReservation_ReturnsFalse()
    {
        var result = await _sut.CancelReservationAsync(Guid.NewGuid());

        Assert.False(result);
    }
}
