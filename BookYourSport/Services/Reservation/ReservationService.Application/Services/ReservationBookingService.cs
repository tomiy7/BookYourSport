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

        var court = club?.Courts.FirstOrDefault(
            c => c.Id == courtId);

        if (club == null || court == null)
        {
            _logger.LogWarning(
                "Reservation attempted for non-existent club {ClubId} or court {CourtId}",
                clubId,
                courtId);

            return null;
        }

        if (!club.IsActive)
        {
            throw new ReservationDomainException(
                "Club is not active.");
        }

        if (!court.IsActive)
        {
            throw new ReservationDomainException(
                "Court is not active.");
        }

        var startTime = DateTime.SpecifyKind(
            createReservationDto.StartTime,
            DateTimeKind.Utc);

        var endTime = DateTime.SpecifyKind(
            createReservationDto.EndTime,
            DateTimeKind.Utc);

        if (!club.IsOpenDuring(startTime, endTime))
        {
            throw new ReservationDomainException(
                "Club is not open for the entire requested time range.");
        }

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

        // Reservation se prvo čuva kao Pending.
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
            // Naplaćuje se puna cena nove rezervacije.
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

            // Ako plaćanje ne uspe,
            // Pending rezervacija ne sme ostati aktivna.
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

    public async Task<ReservationDto?> RescheduleReservationAsync(
        Guid reservationId,
        RescheduleReservationDto rescheduleReservationDto)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                reservationId);

        if (reservation == null)
        {
            _logger.LogWarning(
                "Attempted to reschedule non-existent reservation {ReservationId}",
                reservationId);

            return null;
        }

        var newStartTime = DateTime.SpecifyKind(
            rescheduleReservationDto.NewStartTime,
            DateTimeKind.Utc);

        var newEndTime = DateTime.SpecifyKind(
            rescheduleReservationDto.NewEndTime,
            DateTimeKind.Utc);

        var club = await _clubRepository.GetByIdAsync(
            reservation.ClubId);

        var court = club?.Courts.FirstOrDefault(
            c => c.Id == reservation.CourtId);

        if (club == null || court == null)
        {
            _logger.LogWarning(
                "Reschedule attempted but club {ClubId} or court {CourtId} no longer exists",
                reservation.ClubId,
                reservation.CourtId);

            throw new ReservationDomainException(
                "Club or court no longer exists.");
        }

        if (!club.IsActive)
        {
            throw new ReservationDomainException(
                "Club is not active.");
        }

        if (!court.IsActive)
        {
            throw new ReservationDomainException(
                "Court is not active.");
        }

        if (!club.IsOpenDuring(
                newStartTime,
                newEndTime))
        {
            throw new ReservationDomainException(
                "Club is not open for the entire requested time range.");
        }

        if (await _reservationRepository.HasOverlapAsync(
                court.Id,
                newStartTime,
                newEndTime,
                excludeReservationId: reservationId))
        {
            throw new ReservationDomainException(
                "This time slot is already booked.");
        }

        // Čuvamo staru cenu PRE promene rezervacije.
        var oldPrice = reservation.Price;

        // Računamo novu cenu prema novom broju sati.
        var durationInHours =
            (decimal)(newEndTime - newStartTime).TotalHours;

        var newPrice =
            court.PricePerHour.Multiply(durationInHours);

        _logger.LogInformation(
            "Reschedule payment check for reservation {ReservationId}. Old price: {OldPrice}, New price: {NewPrice}",
            reservation.Id,
            oldPrice.Amount,
            newPrice.Amount);

        // =====================================================
        // NOVA CENA JE VEĆA
        // Naplaćuje se SAMO razlika.
        //
        // Ako korisnik nema dovoljno kredita, ChargeAsync baca
        // exception i reservation.Reschedule() se NE izvršava.
        // =====================================================
        if (newPrice.Amount > oldPrice.Amount)
        {
            var amountToCharge =
                newPrice.Amount - oldPrice.Amount;

            _logger.LogInformation(
                "Reschedule requires additional charge of {Amount} for reservation {ReservationId}",
                amountToCharge,
                reservation.Id);

            await _paymentServiceClient.ChargeAsync(
                reservation.UserId,
                amountToCharge,
                reservation.Id);

            _logger.LogInformation(
                "Additional charge successful for reservation {ReservationId}",
                reservation.Id);
        }

        // =====================================================
        // NOVA CENA JE MANJA
        // Refundira se razlika.
        //
        // Payment Service / RefundPolicy određuje da li je
        // refund prema policy dozvoljen i koliki je stvarni iznos.
        // =====================================================
        else if (newPrice.Amount < oldPrice.Amount)
        {
            var amountToRefund =
                oldPrice.Amount - newPrice.Amount;

            _logger.LogInformation(
                "Reschedule requires refund of {Amount} for reservation {ReservationId}",
                amountToRefund,
                reservation.Id);

            await _paymentServiceClient.RefundAsync(
                reservation.UserId,
                amountToRefund,
                reservation.Id,
                reservation.StartTime,
                DateTime.UtcNow);

            _logger.LogInformation(
                "Refund successfully processed for reservation {ReservationId}",
                reservation.Id);
        }

        // =====================================================
        // CENA JE ISTA
        // Nema payment akcije.
        // =====================================================
        else
        {
            _logger.LogInformation(
                "Reschedule price did not change for reservation {ReservationId}",
                reservation.Id);
        }

        // Tek nakon uspešne payment akcije menjamo rezervaciju.
        // Ako ChargeAsync baci exception, ovaj kod se ne izvršava.
        reservation.Reschedule(
            newStartTime,
            newEndTime,
            newPrice);

        try
        {
            await _reservationRepository.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _logger.LogWarning(
                "Reschedule blocked by database constraint for reservation {ReservationId}",
                reservationId);

            throw new ReservationDomainException(
                "This time slot was just booked by someone else.");
        }

        _logger.LogInformation(
            "Reservation {ReservationId} successfully rescheduled to {NewStartTime}",
            reservationId,
            newStartTime);

        return MapToDto(reservation);
    }

    public async Task<bool> CancelReservationAsync(
        Guid reservationId)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                reservationId);

        if (reservation == null)
        {
            _logger.LogWarning(
                "Attempted to cancel non-existent reservation {ReservationId}",
                reservationId);

            return false;
        }

        var cancellationTime = DateTime.UtcNow;

        _logger.LogInformation(
            "Cancellation requested for reservation {ReservationId}. " +
            "UserId: {UserId}, Original price: {OriginalPrice}, " +
            "Reservation start: {ReservationStart}, Cancellation time: {CancellationTime}",
            reservation.Id,
            reservation.UserId,
            reservation.Price.Amount,
            reservation.StartTime,
            cancellationTime);

        // Payment Service dobija originalnu cenu.
        // RefundPolicy unutar Payment Service-a određuje
        // koliko se stvarno vraća korisniku.
        await _paymentServiceClient.RefundAsync(
            reservation.UserId,
            reservation.Price.Amount,
            reservation.Id,
            reservation.StartTime,
            cancellationTime);

        _logger.LogInformation(
            "Refund request successfully processed for reservation {ReservationId}. " +
            "Reservation cancellation will be completed through the payment event flow.",
            reservation.Id);

        return true;
    }

    public async Task<List<ReservationDto>> GetByUserIdAsync(
        Guid userId)
    {
        var reservations =
            await _reservationRepository.GetByUserAsync(userId);

        return reservations
            .Select(MapToDto)
            .ToList();
    }

    public async Task<List<ReservationDto>> GetByClubIdAsync(
        Guid clubId)
    {
        var reservations =
            await _reservationRepository.GetByClubAsync(clubId);

        return reservations
            .Select(MapToDto)
            .ToList();
    }

    private static ReservationDto MapToDto(
        Reservation reservation)
    {
        return new ReservationDto
        {
            Id = reservation.Id,
            CourtId = reservation.CourtId,
            ClubId = reservation.ClubId,
            UserId = reservation.UserId,
            StartTime = reservation.StartTime,
            EndTime = reservation.EndTime,
            Price = new PriceDto
            {
                Amount = reservation.Price.Amount,
                Currency = reservation.Price.Currency
            },
            Status = reservation.Status.ToString()
        };
    }
}