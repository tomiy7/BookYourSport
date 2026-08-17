using PaymentService.Application.Interfaces;

namespace PaymentService.Tests.Fakes;

public class FakePdfContractGenerator : IPdfContractGenerator
{
    public string DocumentPath { get; set; }
        = "documents/contracts/test-contract.pdf";

    public Task<string> GenerateContractAsync(
        Guid userId,
        string firstName,
        string lastName)
    {
        return Task.FromResult(DocumentPath);
    }
}