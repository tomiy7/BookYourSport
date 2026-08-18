using PaymentService.Application.Interfaces;
using QuestPDF.Fluent;

namespace PaymentService.Infrastructure.Documents;

public class PdfContractGenerator : IPdfContractGenerator
{
    public Task<string> GenerateContractAsync(
        Guid userId,
        string firstName,
        string lastName)
    {
        // Generate a unique identifier for the contract document.
        var contractId = Guid.NewGuid();

        // Store generated contracts in the application's documents directory.
        var directory = Path.Combine(
            AppContext.BaseDirectory,
            "documents",
            "contracts");

        Directory.CreateDirectory(directory);

        var filePath = Path.Combine(
            directory,
            $"{contractId}.pdf");

        // Create and render the contract PDF using the user's information.
        var document = new ContractPdfDocument(
            contractId,
            firstName,
            lastName);

        document.GeneratePdf(filePath);

        return Task.FromResult(filePath);
    }
}