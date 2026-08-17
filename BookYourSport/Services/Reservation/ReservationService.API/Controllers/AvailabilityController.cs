using Microsoft.AspNetCore.Mvc;
using ReservationService.Application.DTOs;
using ReservationService.Application.Interfaces;

namespace ReservationService.API.Controllers;

[ApiController]
[Route("api/clubs/{clubId:guid}/courts/{courtId:guid}/availability")]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availabilityService;
    
    public AvailabilityController(IAvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AvailableSlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAvailableSlots(Guid clubId, Guid courtId, [FromQuery] DateOnly date)
    {
        var slots = await _availabilityService.GetAvailableSlotsAsync(clubId, courtId, date);
        if (slots == null)
            return NotFound(new { error = "CLUB_OR_COURT_NOT_FOUND" });
        
        return Ok(slots);
    }
}