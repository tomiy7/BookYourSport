namespace PaymentService.API.Requests;

public record TopUpCreditRequest(
    int Amount,
    string Currency);