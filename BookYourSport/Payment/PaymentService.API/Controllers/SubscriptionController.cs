using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands.PaySubscription;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly PaySubscriptionHandler _handler;

    public SubscriptionController(PaySubscriptionHandler handler)
    {
        _handler = handler;
    }

    // Processes the user's subscription payment after the contract has been signed.
    [HttpPost("pay")]
    public async Task<IActionResult> Pay(
        [FromBody] PaySubscriptionCommand command)
    {
        var result = await _handler.Handle(command);

        return Ok(result);
    }
}