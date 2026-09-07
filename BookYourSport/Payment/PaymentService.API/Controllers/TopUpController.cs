using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.API.Requests;
using PaymentService.Application.Commands.TopUpCredit;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TopUpController : ControllerBase
{
    private readonly TopUpCreditHandler _handler;

    public TopUpController(TopUpCreditHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> TopUp([FromBody] TopUpCreditRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();
        
        var command = new TopUpCreditCommand(
            userId,
            request.Amount,
            request.Currency);

        var result = await _handler.Handle(command);

        return Ok(result);
    }
}