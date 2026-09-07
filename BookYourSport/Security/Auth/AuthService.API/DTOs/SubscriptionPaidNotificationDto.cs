namespace AuthService.API.DTOs;

public class SubscriptionPaidNotificationDto
{
    public Guid UserId { get; set; }

    public Guid PaymentId { get; set; }

    public Guid ContractId { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = string.Empty;
}