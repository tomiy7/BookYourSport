namespace PaymentService.Application.Commands.TopUpCredit;

public record TopUpCreditCommand(
    Guid UserId,
    int Amount,
    string Currency);