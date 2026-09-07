using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;
using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.API.Controllers;

[ApiController]
[Route("api/clubs")]
public class ClubsController : ControllerBase
{
    private readonly IClubService _clubService;
    private readonly ILogger<ClubsController> _logger;

    public ClubsController(IClubService clubService, ILogger<ClubsController> logger)
    {
        _clubService = clubService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ClubDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllClubs()
    {
        var clubs = await _clubService.GetAllClubsAsync();
        return Ok(clubs);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClubDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClubById(Guid id)
    {
        var club = await _clubService.GetClubByIdAsync(id);
        if (club == null)
            return NotFound(new { error = "CLUB_NOT_FOUND" });
        
        return Ok(club);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Club)]
    [ProducesResponseType(typeof(ClubDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateClub(CreateClubDto createClubDto)
    {
        if (!TryGetCurrentUserId(out var ownerId))
            return Unauthorized();

        createClubDto.OwnerId = ownerId;
        
        try
        {
            var club = await _clubService.CreateClubAsync(createClubDto);
            return CreatedAtAction(nameof(GetClubById), new { id = club.Id }, club);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Club creation request failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(typeof(ClubDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateClub(Guid id, UpdateClubDto updateClubDto)
    {
        var accessError = await CheckClubAccess(id);
        if (accessError != null) return accessError;
        
        try
        {
            var updated = await _clubService.UpdateClubAsync(id, updateClubDto);
            if (updated == null)
                return NotFound(new { error = "CLUB_NOT_FOUND" });
            
            return Ok(updated);
        }
        catch (ReservationDomainException e)
        {
            _logger.LogWarning("Club update request failed: {Reason}", e.Message);
            return BadRequest(new { error = "DOMAIN_RULE_VIOLATION", message = e.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.ClubOrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteClub(Guid id)
    {
        var accessError = await CheckClubAccess(id);
        if (accessError != null) return accessError;
        
        var deleted = await _clubService.DeleteClubAsync(id);
        if (!deleted)
            return NotFound(new { error = "CLUB_NOT_FOUND" });
        
        return NoContent();
    }
    
    private bool TryGetCurrentUserId(out Guid userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out userId);
    }

    private async Task<IActionResult?> CheckClubAccess(Guid clubId)
    {
        if (User.IsInRole(Roles.Admin)) return null;

        var club = await _clubService.GetClubByIdAsync(clubId);
        if (club == null) return NotFound(new { error = "CLUB_NOT_FOUND" });

        if (!TryGetCurrentUserId(out var currentUserId) || club.OwnerId != currentUserId)
            return Forbid();

        return null;
    }
}