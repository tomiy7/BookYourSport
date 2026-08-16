using System;
using PaymentService.Domain.Enums;

namespace PaymentService.Domain.Entities;

public class Transaction
{
    internal Transaction(
        int amount,
        TransactionType type,
        Guid? referenceId)
    {
        if (amount <= 0)
            throw new ArgumentException(
                "Transaction amount must be greater than zero.",
                nameof(amount));

        if (!Enum.IsDefined(type))
            throw new ArgumentException(
                "Invalid transaction type.",
                nameof(type));

        Id = Guid.NewGuid();
        Amount = amount;
        Type = type;
        CreatedAt = DateTime.UtcNow;
        ReferenceId = referenceId;
    }

    public Guid Id { get; private set; }
    public int Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? ReferenceId { get; private set; }
}