using PaymentService.Application.Interfaces;
using QuestPDF.Fluent;

namespace PaymentService.Infrastructure.Documents;

public class PdfContractGenerator : IPdfContractGenerator
{
    public Task<string> GenerateContractAsync(
        Guid userId,
        string firstName,
        string lastName,
        decimal amount,
        string currency)
    {
        var contractId = Guid.NewGuid();

        var directory = Path.Combine(
            AppContext.BaseDirectory,
            "documents",
            "contracts");

        Directory.CreateDirectory(directory);

        var filePath = Path.Combine(
            directory,
            $"{contractId}.pdf");

        var document = new ContractPdfDocument(
            contractId,
            firstName,
            lastName,
            amount,
            currency);

        document.GeneratePdf(filePath);

        return Task.FromResult(filePath);
    }
}