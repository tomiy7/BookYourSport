using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using ReservationService.Application.DTOs;
using ReservationService.Application.Services;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Enums;
using ReservationService.Domain.ValueObjects;
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
    public async Task CreateReservationAsync_ValidSlot_ReturnsConfirmedReservation()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club, price: 1500m);
        _clubRepository.Seed(club);

        var start = TestData.NextMondayAt(9);
        var dto = new CreateReservationDto { UserId = Guid.NewGuid(), StartTime = start, EndTime = start.AddHours(1) };

        var result = await _sut.CreateReservationAsync(club.Id, court.Id, dto);

        Assert.NotNull(result);
        Assert.Equal("Confirmed", result!.Status);
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

    private static Reservation SeedConfirmedReservation(Guid clubId, Guid courtId, decimal price = 1500m)
    {
        var start = TestData.NextMondayAt(9);

        var reservation = Reservation.Create(
            courtId,
            clubId,
            Guid.NewGuid(),
            start,
            start.AddHours(1),
            Price.Create(price));

        reservation.Confirm();

        return reservation;
    }

    [Fact]
    public async Task CancelUpcomingReservationsForCourtAsync_ConfirmedReservation_RefundsAndCancelsWithReason()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var reservation = SeedConfirmedReservation(club.Id, court.Id);
        _reservationRepository.Seed(reservation);

        var (cancelled, failed) = await _sut.CancelUpcomingReservationsForCourtAsync(
            club.Id,
            court.Id,
            CancellationReasons.CourtDeactivated);

        Assert.Equal(1, cancelled);
        Assert.Equal(0, failed);
        Assert.True(_paymentServiceClient.RefundCalled);
        Assert.Equal(reservation.Id, _paymentServiceClient.LastReservationId);
        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
        Assert.Equal(CancellationReasons.CourtDeactivated, reservation.CancellationReason);
    }

    [Fact]
    public async Task CancelUpcomingReservationsForCourtAsync_ReservationOnAnotherCourt_IsNotTouched()
    {
        var club = TestData.ActiveClub();
        var deactivatedCourt = TestData.AddActiveCourt(club, "Teren 1");
        var otherCourt = TestData.AddActiveCourt(club, "Teren 2");
        _clubRepository.Seed(club);

        var reservation = SeedConfirmedReservation(club.Id, otherCourt.Id);
        _reservationRepository.Seed(reservation);

        var (cancelled, failed) = await _sut.CancelUpcomingReservationsForCourtAsync(
            club.Id,
            deactivatedCourt.Id,
            CancellationReasons.CourtDeactivated);

        Assert.Equal(0, cancelled);
        Assert.Equal(0, failed);
        Assert.False(_paymentServiceClient.RefundCalled);
        Assert.Equal(ReservationStatus.Confirmed, reservation.Status);
        Assert.Null(reservation.CancellationReason);
    }

    [Fact]
    public async Task CancelUpcomingReservationsForCourtAsync_RefundFails_ReservationStaysConfirmed()
    {
        var club = TestData.ActiveClub();
        var court = TestData.AddActiveCourt(club);
        _clubRepository.Seed(club);

        var reservation = SeedConfirmedReservation(club.Id, court.Id);
        _reservationRepository.Seed(reservation);

        _paymentServiceClient.ThrowOnRefund = true;

        var (cancelled, failed) = await _sut.CancelUpcomingReservationsForCourtAsync(
            club.Id,
            court.Id,
            CancellationReasons.CourtDeactivated);

        Assert.Equal(0, cancelled);
        Assert.Equal(1, failed);

        // Novac nije vraćen, pa rezervacija ne sme biti otkazana.
        Assert.Equal(ReservationStatus.Confirmed, reservation.Status);
        Assert.Null(reservation.CancellationReason);
    }
}
