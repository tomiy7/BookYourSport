using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.API.Controllers;

[ApiController]
[Route("api")]
public class ReservationController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly IClubService _clubService;
    private readonly ILogger<ReservationController> _logger;

    public ReservationController(IReservationService reservationService, IClubService clubService, ILogger<ReservationController> logger)
    {
        _reservationService = reservationService;
        _clubService = clubService;
        _logger = logger;
    }

    [HttpPost("clubs/{clubId:guid}/courts/{courtId:guid}/reservations")]
    [Authorize(Roles = Roles.Player)]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid clubId, Guid courtId, CreateReservationDto createReservationDto)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        createReservationDto.UserId = userId;
        
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

            if (e.ErrorCode == "INSUFFICIENT_CREDIT")
            {
                return StatusCode(
                    StatusCodes.Status402PaymentRequired,
                    new { error = "INSUFFICIENT_CREDIT", message = e.Message });
            }

            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpPut("reservations/{id:guid}/reschedule")]
    [Authorize(Roles = Roles.PlayerOrAdmin)]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)] 
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reschedule(Guid id, RescheduleReservationDto rescheduleReservationDto)
    {
        if (!await IsOwnerOrAdmin(id))
            return Forbid();
        
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
    [Authorize(Roles = Roles.PlayerClubOrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)] 
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id)
    {
        if (!await CanCancel(id))
            return Forbid();
        
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
    [Authorize(Roles = Roles.PlayerOrAdmin)]
    [ProducesResponseType(typeof(List<ReservationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)] 
    public async Task<IActionResult> GetByUserId(Guid userId)
    {
        if (!User.IsInRole(Roles.Admin))
        {
            if (!TryGetCurrentUserId(out var currentUserId) || currentUserId != userId)
                return Forbid();
        }
        
        var reservations = await _reservationService.GetByUserIdAsync(userId);
        return Ok(reservations);
    }

    [HttpGet("reservations/club/{clubId:guid}")]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(typeof(List<ReservationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)] 
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByClubId(Guid clubId)
    {
        if (!User.IsInRole(Roles.Admin))
        {
            var club = await _clubService.GetClubByIdAsync(clubId);
            if (club == null)
                return NotFound(new { error = "CLUB_NOT_FOUND" });

            if (!TryGetCurrentUserId(out var currentUserId) || club.OwnerId != currentUserId)
                return Forbid();
        }
        
        var reservations = await _reservationService.GetByClubIdAsync(clubId);
        return Ok(reservations);
    }
    
    private bool TryGetCurrentUserId(out Guid userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out userId);
    }

    private async Task<bool> IsOwnerOrAdmin(Guid reservationId)
    {
        if (User.IsInRole(Roles.Admin)) return true;

        if (!TryGetCurrentUserId(out var currentUserId)) return false;

        var reservations = await _reservationService.GetByUserIdAsync(currentUserId);
        return reservations.Any(r => r.Id == reservationId);
    }
    
    private async Task<bool> CanCancel(Guid reservationId)
    {
        if (User.IsInRole(Roles.Admin)) return true;

        if (!TryGetCurrentUserId(out var currentUserId)) return false;

        if (User.IsInRole(Roles.Player))
        {
            var playerReservations = await _reservationService.GetByUserIdAsync(currentUserId);
            if (playerReservations.Any(r => r.Id == reservationId)) return true;
        }

        if (User.IsInRole(Roles.Club))
        {
            var clubs = await _clubService.GetAllClubsAsync();
            var ownedClubs = clubs.Where(c => c.OwnerId == currentUserId).Select(c => c.Id);

            foreach (var clubId in ownedClubs)
            {
                var clubReservations = await _reservationService.GetByClubIdAsync(clubId);
                if (clubReservations.Any(r => r.Id == reservationId)) return true;
            }
        }

        return false;
    }
}