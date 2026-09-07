using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PaymentService.Infrastructure.Documents;

// Defines the content and layout of the club owner subscription agreement.
public class ContractPdfDocument : IDocument
{
    private readonly Guid _contractId;
    private readonly string _firstName;
    private readonly string _lastName;
    private readonly decimal _amount;
    private readonly string _currency;

    public ContractPdfDocument(
        Guid contractId,
        string firstName,
        string lastName,
        decimal amount,
        string currency)
    {
        _contractId = contractId;
        _firstName = firstName;
        _lastName = lastName;
        _amount = amount;
        _currency = currency;
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
            page.Size(PageSizes.A4);
            page.Margin(50);
            page.DefaultTextStyle(x => x
                .FontSize(11)
                .FontColor(Colors.Grey.Darken3));

            // HEADER
            page.Header()
                .Column(header =>
                {
                    header.Item()
                        .Text("BOOKYOURSPORT")
                        .FontSize(24)
                        .Bold()
                        .FontColor(Colors.Blue.Darken3);

                    header.Item()
                        .PaddingTop(8)
                        .LineHorizontal(1)
                        .LineColor(Colors.Grey.Lighten1);
                });

            // CONTENT
            page.Content()
                .PaddingVertical(30)
                .Column(column =>
                {
                    column.Spacing(12);

                    // TITLE
                    column.Item()
                        .Text("CLUB OWNER SUBSCRIPTION AGREEMENT")
                        .FontSize(18)
                        .Bold()
                        .FontColor(Colors.Grey.Darken4);

                    column.Item()
                        .PaddingBottom(15)
                        .Text($"Contract ID: {_contractId}")
                        .FontSize(9)
                        .FontColor(Colors.Grey.Darken1);

                    // CLUB OWNER
                    column.Item()
                        .PaddingTop(10)
                        .Text("CLUB OWNER DETAILS")
                        .FontSize(12)
                        .SemiBold()
                        .FontColor(Colors.Blue.Darken3);

                    column.Item()
                        .LineHorizontal(0.5f)
                        .LineColor(Colors.Grey.Lighten2);

                    column.Item()
                        .PaddingVertical(8)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text("Name")
                                .SemiBold();

                            row.RelativeItem(2)
                                .Text($"{_firstName} {_lastName}");
                        });

                    // SUBSCRIPTION
                    column.Item()
                        .PaddingTop(20)
                        .Text("SUBSCRIPTION DETAILS")
                        .FontSize(12)
                        .SemiBold()
                        .FontColor(Colors.Blue.Darken3);

                    column.Item()
                        .LineHorizontal(0.5f)
                        .LineColor(Colors.Grey.Lighten2);

                    column.Item()
                        .PaddingVertical(12)
                        .Background(Colors.Grey.Lighten4)
                        .Padding(15)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text("Subscription Fee")
                                .SemiBold();

                            row.RelativeItem()
                                .AlignRight()
                                .Text($"{_amount:N2} {_currency}")
                                .FontSize(14)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                        });

                    // AGREEMENT
                    column.Item()
                        .PaddingTop(20)
                        .Text("AGREEMENT")
                        .FontSize(12)
                        .SemiBold()
                        .FontColor(Colors.Blue.Darken3);

                    column.Item()
                        .LineHorizontal(0.5f)
                        .LineColor(Colors.Grey.Lighten2);

                    column.Item()
                        .PaddingTop(8)
                        .Text(
                            "This agreement confirms the subscription between " +
                            "the Club Owner and BookYourSport. By signing this " +
                            "agreement, the Club Owner confirms acceptance of " +
                            "the subscription terms and the subscription fee " +
                            "specified above.")
                        .LineHeight(1.5f);

                    // SIGNATURES
                    column.Item()
                        .PaddingTop(55)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Column(left =>
                                {
                                    left.Item()
                                        .LineHorizontal(1)
                                        .LineColor(Colors.Grey.Darken1);

                                    left.Item()
                                        .PaddingTop(5)
                                        .Text("Club Owner")
                                        .SemiBold();

                                    left.Item()
                                        .Text($"{_firstName} {_lastName}")
                                        .FontSize(9)
                                        .FontColor(Colors.Grey.Darken1);
                                });

                            row.ConstantItem(60);

                            row.RelativeItem()
                                .Column(right =>
                                {
                                    right.Item()
                                        .LineHorizontal(1)
                                        .LineColor(Colors.Grey.Darken1);

                                    right.Item()
                                        .PaddingTop(5)
                                        .Text("BookYourSport")
                                        .SemiBold();

                                    right.Item()
                                        .Text("Authorized Representative")
                                        .FontSize(9)
                                        .FontColor(Colors.Grey.Darken1);
                                });
                        });
                });

            // FOOTER
            page.Footer()
                .Column(footer =>
                {
                    footer.Item()
                        .LineHorizontal(0.5f)
                        .LineColor(Colors.Grey.Lighten2);

                    footer.Item()
                        .PaddingTop(8)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text("BookYourSport")
                                .FontSize(9)
                                .SemiBold();

                            row.RelativeItem()
                                .AlignRight()
                                .Text(DateTime.UtcNow.ToString("yyyy-MM-dd"))
                                .FontSize(9)
                                .FontColor(Colors.Grey.Darken1);
                        });
                });
        });
    }

}