namespace AuthService.API.DTOs;

public class ContractSignedNotificationDto
{
    public Guid UserId { get; set; }

    public Guid ContractId { get; set; }
}