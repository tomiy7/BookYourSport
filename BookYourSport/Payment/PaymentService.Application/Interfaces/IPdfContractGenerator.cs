namespace PaymentService.Application.Interfaces;

public interface IPdfContractGenerator
{
    Task<string> GenerateContractAsync(
        Guid userId,
        string firstName,
        string lastName,
        decimal amount,
        string currency);
}