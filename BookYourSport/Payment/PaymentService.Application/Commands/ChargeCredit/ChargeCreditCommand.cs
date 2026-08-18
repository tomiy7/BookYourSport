namespace PaymentService.Application.Commands.ChargeCredit;

public record ChargeCreditCommand(
    Guid UserId,
    int Amount,
    Guid ReferenceId);