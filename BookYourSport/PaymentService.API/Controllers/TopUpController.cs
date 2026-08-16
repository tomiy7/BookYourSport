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
    public async Task<IActionResult> TopUp([FromBody] TopUpCreditRequest request)
    {
        var command = new TopUpCreditCommand(
            request.UserId,
            request.Amount,
            request.Currency);

        var result = await _handler.Handle(command);

        return Ok(result);
    }
}