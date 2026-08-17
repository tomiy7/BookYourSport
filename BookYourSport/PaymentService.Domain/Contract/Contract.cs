namespace PaymentService.Domain.Contract;

public class Contract
{
    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public string DocumentPath { get; private set; }

    public ContractStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? SignedAt { get; private set; }

    private Contract()
    {
    }

    public Contract(
        Guid userId,
        string documentPath)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        DocumentPath = documentPath;
        Status = ContractStatus.PendingSignature;
        CreatedAt = DateTime.UtcNow;
    }

    public void Sign()
    {
        if (Status != ContractStatus.PendingSignature)
            throw new InvalidOperationException(
                "Contract is not waiting for signature.");

        Status = ContractStatus.Signed;
        SignedAt = DateTime.UtcNow;
    }
}