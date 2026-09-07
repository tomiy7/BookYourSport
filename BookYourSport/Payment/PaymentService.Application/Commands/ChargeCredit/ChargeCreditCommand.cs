namespace PaymentService.Application.Commands.ChargeCredit;

public record ChargeCreditCommand(
    Guid UserId,
    decimal Amount,
    Guid ReferenceId);