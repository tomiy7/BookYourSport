namespace PaymentService.API.Requests;

public record TopUpCreditRequest(
    Guid UserId,
    int Amount,
    string Currency);