namespace PaymentService.Application.Commands.GenerateContract;

public class GenerateContractCommand
{
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }

    public string Currency { get; set; } = "RSD";
}