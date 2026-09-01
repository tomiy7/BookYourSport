using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands.GenerateContract;
using PaymentService.Application.Commands.SignContract;
using PaymentService.Application.Interfaces;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("contracts")]
public class ContractController : ControllerBase
{
    private readonly GenerateContractHandler _handler;
    private readonly IContractRepository _contractRepository;
    private readonly SignContractHandler _signContractHandler;

    public ContractController(
        GenerateContractHandler handler,
        IContractRepository contractRepository,
        SignContractHandler signContractHandler)
    {
        _handler = handler;
        _contractRepository = contractRepository;
        _signContractHandler = signContractHandler;
    }


    // ==================================================
    // GENERATE CONTRACT
    // ==================================================

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateContract(
        GenerateContractCommand command)
    {
        var contract =
            await _handler.Handle(command);

        return Ok(new
        {
            contractId = contract.Id,
            userId = contract.UserId,
            documentPath = contract.DocumentPath,

            status =
                contract.Status.ToString(),

            createdAt = contract.CreatedAt,
            signedAt = contract.SignedAt
        });
    }


    // ==================================================
    // GET CONTRACT BY CONTRACT ID
    // ==================================================

    [HttpGet("{contractId}")]
    public async Task<IActionResult> GetContract(
        Guid contractId)
    {
        var contract =
            await _contractRepository.GetByIdAsync(
                contractId);

        if (contract == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            contractId = contract.Id,
            userId = contract.UserId,
            documentPath = contract.DocumentPath,

            status =
                contract.Status.ToString(),

            createdAt = contract.CreatedAt,
            signedAt = contract.SignedAt
        });
    }


    // ==================================================
    // GET CONTRACT BY USER ID
    // ==================================================

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetContractByUserId(
        Guid userId)
    {
        var contract =
            await _contractRepository.GetByUserIdAsync(
                userId);

        if (contract == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            contractId = contract.Id,
            userId = contract.UserId,
            documentPath = contract.DocumentPath,

            status =
                contract.Status.ToString(),

            createdAt = contract.CreatedAt,
            signedAt = contract.SignedAt
        });
    }


    // ==================================================
    // GET CONTRACT PDF
    // ==================================================

    [HttpGet("{contractId}/document")]
    public async Task<IActionResult> GetContractDocument(
        Guid contractId)
    {
        var contract =
            await _contractRepository.GetByIdAsync(
                contractId);

        if (contract == null)
        {
            return NotFound();
        }

        if (
            !System.IO.File.Exists(
                contract.DocumentPath
            )
        )
        {
            return NotFound(
                "Contract document not found."
            );
        }

        var fileBytes =
            await System.IO.File.ReadAllBytesAsync(
                contract.DocumentPath);

        return File(
            fileBytes,
            "application/pdf",
            $"contract-{contract.Id}.pdf"
        );
    }


    // ==================================================
    // SIGN CONTRACT
    // ==================================================

    [HttpPost("{contractId}/sign")]
    public async Task<IActionResult> SignContract(
        Guid contractId)
    {
        var contract =
            await _signContractHandler.Handle(
                new SignContractCommand
                {
                    ContractId = contractId
                });

        return Ok(new
        {
            contractId = contract.Id,
            userId = contract.UserId,

            status =
                contract.Status.ToString(),

            signedAt = contract.SignedAt
        });
    }
}