namespace AuthService.API.DTOs;

public class SubscriptionPaidRequestDto
{
    public Guid UserId { get; set; }

    public Guid PaymentId { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = string.Empty;

    public Guid ContractId { get; set; }
}