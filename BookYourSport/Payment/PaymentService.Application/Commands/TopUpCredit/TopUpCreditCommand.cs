namespace PaymentService.Application.Commands.TopUpCredit;

public record TopUpCreditCommand(
    Guid UserId,
    decimal Amount,
    string Currency);