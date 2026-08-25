using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.API.Controllers;

[ApiController]
[Route("api/clubs/{clubId:guid}/courts")]
public class CourtController : ControllerBase
{
    private readonly ICourtService  _courtService;
    private readonly IClubService _clubService;
    private readonly ILogger<CourtController> _logger;

    public CourtController(ICourtService courtService, IClubService clubService, ILogger<CourtController> logger)
    {
        _courtService = courtService;
        _clubService = clubService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CourtDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByClub(Guid clubId)
    {
        var courts = await _courtService.GetByClubIdAsync(clubId);
        if (courts == null)
            return NotFound(new { error = "CLUB_NOT_FOUND" });
        
        return Ok(courts);
    }

    [HttpGet("{courtId:guid}")]
    [ProducesResponseType(typeof(CourtDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid clubId, Guid courtId)
    {
        var court = await _courtService.GetCourtByIdAsync(clubId, courtId);
        if (court == null)
            return NotFound(new { error = "COURT_NOT_FOUND" });
        
        return Ok(court);
    }

    [HttpPost]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(typeof(CourtDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCourt(Guid clubId, CreateCourtDto courtDto)
    {
        if (!User.IsInRole(Roles.Admin) && !await IsOwner(clubId))
            return Forbid();
        
        try
        {
            var court = await _courtService.CreateCourtAsync(clubId, courtDto);
            if (court == null)
                return NotFound(new { error = "CLUB_NOT_FOUND" });
            
            return CreatedAtAction(nameof(GetById), new { clubId, courtId = court.Id }, court);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Court creation request failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpPut("{courtId:guid}")]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(typeof(CourtDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCourt(Guid clubId, Guid courtId, UpdateCourtDto courtDto)
    {
        if (!User.IsInRole(Roles.Admin) && !await IsOwner(clubId))
            return Forbid();
        
        try
        {
            var updated = await _courtService.UpdateCourtAsync(clubId, courtId, courtDto);
            if (updated == null)
                return NotFound(new { error = "COURT_NOT_FOUND" });
            
            return Ok(updated);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Court update request failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpDelete("{courtId:guid}")]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid clubId, Guid courtId)
    {
        if (!User.IsInRole(Roles.Admin) && !await IsOwner(clubId))
            return Forbid();
        
        var deleted = await _courtService.DeleteCourtAsync(clubId, courtId);
        if (!deleted)
            return NotFound(new { error = "COURT_NOT_FOUND" });

        return NoContent();
    }
    
    private bool TryGetCurrentUserId(out Guid userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out userId);
    }

    private async Task<bool> IsOwner(Guid clubId)
    {
        var club = await _clubService.GetClubByIdAsync(clubId);
        if (club == null) return false;

        return TryGetCurrentUserId(out var currentUserId) && club.OwnerId == currentUserId;
    }
}