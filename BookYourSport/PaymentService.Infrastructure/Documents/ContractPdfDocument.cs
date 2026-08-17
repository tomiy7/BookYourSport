using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PaymentService.Infrastructure.Documents;

public class ContractPdfDocument : IDocument
{
    private readonly Guid _contractId;
    private readonly string _firstName;
    private readonly string _lastName;

    public ContractPdfDocument(
        Guid contractId,
        string firstName,
        string lastName)
    {
        _contractId = contractId;
        _firstName = firstName;
        _lastName = lastName;
    }

    public DocumentMetadata GetMetadata()
    {
        return new DocumentMetadata
        {
            Title = "BookYourSport Club Owner Agreement",
            Author = "BookYourSport"
        };
    }

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(50);

            page.Header()
                .Text("BOOKYOURSPORT")
                .FontSize(24)
                .Bold();

            page.Content()
                .PaddingVertical(30)
                .Column(column =>
                {
                    column.Item()
                        .Text("CLUB OWNER SUBSCRIPTION AGREEMENT")
                        .FontSize(18)
                        .Bold();

                    column.Item()
                        .PaddingTop(20)
                        .Text($"Contract ID: {_contractId}");

                    column.Item()
                        .PaddingTop(20)
                        .Text("Club Owner");

                    column.Item()
                        .Text($"{_firstName} {_lastName}");

                    column.Item()
                        .PaddingTop(30)
                        .Text(
                            "This agreement confirms the subscription " +
                            "between the Club Owner and BookYourSport.");
                });

            page.Footer()
                .AlignCenter()
                .Text(text =>
                {
                    text.Span("BookYourSport");
                    text.Span(" • ");
                    text.Span(DateTime.UtcNow.ToString("yyyy-MM-dd"));
                });
        });
    }
}