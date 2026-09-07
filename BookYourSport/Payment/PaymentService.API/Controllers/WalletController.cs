using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Interfaces;

namespace PaymentService.API.Controllers;

[Authorize]
[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly ICreditAccountRepository _creditAccountRepository;

    public WalletController(ICreditAccountRepository creditAccountRepository)
    {
        _creditAccountRepository = creditAccountRepository;
    }

    // Vraća trenutni kredit ulogovanog korisnika.
    // Ako korisnik nema još CreditAccount (nov je), vraćamo 0
    // umesto 404 greške.
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var account = await _creditAccountRepository.GetByUserIdAsync(userId);

        return Ok(new
        {
            balance = account?.Balance ?? 0m,
            currency = "RSD"
        });
    }

    // Vraća istoriju transakcija (uplate, naplate, refundi)
    // ulogovanog korisnika, najnovije prve.
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var account = await _creditAccountRepository.GetByUserIdAsync(userId);

        var transactions = (account?.Transactions
                ?? Enumerable.Empty<PaymentService.Domain.Entities.Transaction>())
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                amount = t.Amount,
                type = t.Type.ToString(),
                referenceId = t.ReferenceId,
                createdAt = t.CreatedAt
            });

        return Ok(transactions);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out userId);
    }
}