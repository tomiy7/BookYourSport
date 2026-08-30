using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands.RefundCredit;

namespace PaymentService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RefundController : ControllerBase
{
    private readonly RefundCreditHandler _handler;

    public RefundController(RefundCreditHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<IActionResult> Refund(
        [FromBody] RefundCreditCommand command)
    {
        var refunded = await _handler.Handle(command);

        return Ok(refunded);
    }
}