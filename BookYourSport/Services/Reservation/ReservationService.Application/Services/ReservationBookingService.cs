using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Entities;
using ReservationService.Domain.Exceptions;
using ReservationService.Domain.Interfaces;

namespace ReservationService.Application.Services;

public class ReservationBookingService : IReservationService
{
    private readonly IClubRepository _clubRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly ILogger<ReservationBookingService> _logger;
    private readonly IPaymentServiceClient _paymentServiceClient;

    public ReservationBookingService(
        IClubRepository clubRepository,
        IReservationRepository reservationRepository,
        ILogger<ReservationBookingService> logger,
        IPaymentServiceClient paymentServiceClient)
    {
        _clubRepository = clubRepository;
        _reservationRepository = reservationRepository;
        _logger = logger;
        _paymentServiceClient = paymentServiceClient;
    }

    public async Task<ReservationDto?> CreateReservationAsync(
    Guid clubId,
    Guid courtId,
    CreateReservationDto createReservationDto)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);
        var court = club?.Courts.FirstOrDefault(c => c.Id == courtId);

        if (club == null || court == null)
        {
            _logger.LogWarning(
                "Reservation attempted for non-existent club {ClubId} or court {CourtId}",
                clubId,
                courtId);

            return null;
        }

        if (!club.IsActive)
            throw new ReservationDomainException("Club is not active.");

        if (!court.IsActive)
            throw new ReservationDomainException("Court is not active.");

        var startTime = DateTime.SpecifyKind(
            createReservationDto.StartTime,
            DateTimeKind.Utc);

        var endTime = DateTime.SpecifyKind(
            createReservationDto.EndTime,
            DateTimeKind.Utc);

        if (!club.IsOpenDuring(startTime, endTime))
            throw new ReservationDomainException(
                "Club is not open for the entire requested time range.");

        if (await _reservationRepository.HasOverlapAsync(
                courtId,
                startTime,
                endTime))
        {
            throw new ReservationDomainException(
                "This time slot is already booked.");
        }

        var durationInHours =
            (decimal)(endTime - startTime).TotalHours;

        var totalPrice =
            court.PricePerHour.Multiply(durationInHours);

        var reservation = Reservation.Create(
            courtId,
            clubId,
            createReservationDto.UserId,
            startTime,
            endTime,
            totalPrice);

        // First persist the reservation as Pending.
        await _reservationRepository.AddAsync(reservation);

        try
        {
            await _reservationRepository.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _logger.LogWarning(
                "Failed to persist pending reservation for court {CourtId} at {StartTime}",
                courtId,
                startTime);

            throw new ReservationDomainException(
                "Could not create reservation.");
        }

        try
        {
            // Charge the user's credit account.
            // Reservation will be confirmed asynchronously
            // after PaymentSucceeded event is received.
            await _paymentServiceClient.ChargeAsync(
                createReservationDto.UserId,
                totalPrice.Amount,
                reservation.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Payment failed for reservation {ReservationId}",
                reservation.Id);

            // Payment failed, so the pending reservation
            // must not remain active.
            reservation.Cancel();

            await _reservationRepository.SaveChangesAsync();

            throw;
        }

        _logger.LogInformation(
            "Reservation {ReservationId} created for court {CourtId} by user {UserId}",
            reservation.Id,
            courtId,
            createReservationDto.UserId);

        return MapToDto(reservation);
    }

    public async Task<ReservationDto?> RescheduleReservationAsync(Guid reservationId, RescheduleReservationDto rescheduleReservationDto)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId);

        if (reservation == null)
        {
            _logger.LogWarning("Attempted to reschedule non-existent reservation {ReservationId}", reservationId);
            return null;
        }
        
        var newStartTime = DateTime.SpecifyKind(rescheduleReservationDto.NewStartTime, DateTimeKind.Utc);
        var newEndTime = DateTime.SpecifyKind(rescheduleReservationDto.NewEndTime, DateTimeKind.Utc);
        
        var club = await _clubRepository.GetByIdAsync(reservation.ClubId);
        var court = club?.Courts.FirstOrDefault(c => c.Id == reservation.CourtId);

        if (club == null || court == null)
        {
            _logger.LogWarning("Reschedule attempted but club {ClubId} or court {CourtId} no longer exists", reservation.ClubId, reservation.CourtId);
            throw new ReservationDomainException("Club or court no longer exists.");
        }
        
        if (!club.IsActive)
            throw new ReservationDomainException("Club is not active.");
        if (!court.IsActive)
            throw new ReservationDomainException("Court is not active.");
        
        if (!club.IsOpenDuring(newStartTime, newEndTime))
            throw new ReservationDomainException("Club is not open for the entire requested time range.");
        
        if (await _reservationRepository.HasOverlapAsync(
                court.Id, newStartTime, newEndTime, excludeReservationId: reservationId))
            throw new ReservationDomainException("This time slot is already booked.");
        
        var durationInHours = (decimal)(newEndTime - newStartTime).TotalHours;
        var newPrice = court.PricePerHour.Multiply(durationInHours);
        reservation.Reschedule(newStartTime, newEndTime, newPrice);

        try
        {
            await _reservationRepository.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _logger.LogWarning(
                "Reschedule blocked by database constraint for reservation {ReservationId}", reservationId);
            throw new ReservationDomainException("This time slot was just booked by someone else.");
        }
        
        _logger.LogInformation("Reservation {ReservationId} rescheduled to {NewStartTime}", reservationId, newStartTime);

        return MapToDto(reservation);
    }

    public async Task<bool> CancelReservationAsync(Guid reservationId)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId);

        if (reservation == null)
        {
            _logger.LogWarning(
                "Attempted to cancel non-existent reservation {ReservationId}",
                reservationId);

            return false;
        }

        var cancellationTime = DateTime.UtcNow;

        await _paymentServiceClient.RefundAsync(
            reservation.UserId,
            reservation.Price.Amount,
            reservation.Id,
            reservation.StartTime,
            cancellationTime);

        _logger.LogInformation(
            "Refund requested for reservation {ReservationId}",
            reservationId);

        return true;
    }

    public async Task<List<ReservationDto>> GetByUserIdAsync(Guid userId)
    {
        var reservations = await _reservationRepository.GetByUserAsync(userId);
        return reservations.Select(MapToDto).ToList();
    }

    public async Task<List<ReservationDto>> GetByClubIdAsync(Guid clubId)
    {
        var reservations = await _reservationRepository.GetByClubAsync(clubId);
        return reservations.Select(MapToDto).ToList();
    }

    private static ReservationDto MapToDto(Reservation r) => new()
    {
        Id = r.Id,
        CourtId = r.CourtId,
        ClubId = r.ClubId,
        UserId = r.UserId,
        StartTime = r.StartTime,
        EndTime = r.EndTime,
        Price = new PriceDto { Amount = r.Price.Amount, Currency = r.Price.Currency },
        Status = r.Status.ToString()
    };
}