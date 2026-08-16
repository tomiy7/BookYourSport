using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands.ChargeCredit;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChargeController : ControllerBase
{
    private readonly ChargeCreditHandler _handler;

    public ChargeController(ChargeCreditHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<IActionResult> Charge(
        [FromBody] ChargeCreditCommand command)
    {
        await _handler.Handle(command);

        return Ok();
    }
}