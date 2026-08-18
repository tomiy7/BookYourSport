using Microsoft.AspNetCore.Mvc;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Exceptions;

namespace ReservationService.API.Controllers;

[ApiController]
[Route("api")]
public class ReservationController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly ILogger<ReservationController> _logger;

    public ReservationController(IReservationService reservationService, ILogger<ReservationController> logger)
    {
        _reservationService = reservationService;
        _logger = logger;
    }

    [HttpPost("clubs/{clubId:guid}/courts/{courtId:guid}/reservations")]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid clubId, Guid courtId, CreateReservationDto createReservationDto)
    {
        try
        {
            var reservation = await _reservationService.CreateReservationAsync(clubId, courtId, createReservationDto);

            if (reservation == null)
                return NotFound(new { error = "CLUB_OR_COURT_NOT_FOUND" });
            
            return CreatedAtAction(nameof(GetByUserId), new { userId = reservation.UserId }, reservation);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Reservation creation failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpPut("reservations/{id:guid}/reschedule")]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reschedule(Guid id, RescheduleReservationDto rescheduleReservationDto)
    {
        try
        {
            var reservation = await _reservationService.RescheduleReservationAsync(id, rescheduleReservationDto);
            
            if (reservation == null)
                return NotFound(new { error = "RESERVATION_NOT_FOUND" });
            
            return Ok(reservation);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Reschedule failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpPut("reservations/{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id)
    {
        try
        {
            var cancelled = await _reservationService.CancelReservationAsync(id);
            
            if (!cancelled)
                return NotFound(new { error = "RESERVATION_NOT_FOUND" });
            
            return NoContent();
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Cancellation failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpGet("reservations/user/{userId:guid}")]
    [ProducesResponseType(typeof(List<ReservationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUserId(Guid userId)
    {
        var reservations = await _reservationService.GetByUserIdAsync(userId);
        return Ok(reservations);
    }

    [HttpGet("reservations/club/{clubId:guid}")]
    [ProducesResponseType(typeof(List<ReservationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByClubId(Guid clubId)
    {
        var reservations = await _reservationService.GetByClubIdAsync(clubId);
        return Ok(reservations);
    }
}