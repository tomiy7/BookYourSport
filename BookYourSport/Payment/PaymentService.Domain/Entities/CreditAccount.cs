using PaymentService.Domain.Enums;

namespace PaymentService.Domain.Entities;

public class CreditAccount
{
    public CreditAccount(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException(
                "User ID cannot be empty.",
                nameof(userId));

        Id = Guid.NewGuid();
        UserId = userId;
        Balance = 0;
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public decimal Balance { get; private set; }

    private readonly List<Transaction> _transactions = new();

    public IReadOnlyCollection<Transaction> Transactions =>
        _transactions.AsReadOnly();

    // Adds credit to the account and records the payment as a transaction.
    public void TopUp(decimal amount, Guid? referenceId)
    {
        if (amount <= 0)
            throw new ArgumentException(
                "Top-up amount must be greater than zero.",
                nameof(amount));

        Balance += amount;

        var transaction = new Transaction(
            amount,
            TransactionType.TopUp,
            referenceId);

        _transactions.Add(transaction);
    }

    // Charges credit for a reservation when sufficient balance is available.
    public Transaction Charge(decimal amount, Guid referenceId)
    {
        if (amount <= 0)
            throw new ArgumentException(
                "Charge amount must be greater than zero.",
                nameof(amount));

        if (referenceId == Guid.Empty)
            throw new ArgumentException(
                "Reference ID cannot be empty.",
                nameof(referenceId));

        var existingTransaction = _transactions.FirstOrDefault(t =>
            t.Type == TransactionType.ReservationCharge &&
            t.ReferenceId == referenceId);

        if (existingTransaction is not null)
        {
            if (existingTransaction.Amount != amount)
                throw new InvalidOperationException(
                    "Reservation has already been charged with a different amount.");

            return existingTransaction;
        }

        if (Balance < amount)
            throw new InvalidOperationException(
                "Insufficient credit.");

        Balance -= amount;

        var transaction = new Transaction(
            amount,
            TransactionType.ReservationCharge,
            referenceId);

        _transactions.Add(transaction);

        return transaction;
    }

    // Refunds credit for a reservation and prevents duplicate refunds.
    public Transaction Refund(decimal amount, Guid referenceId)
    {
        if (amount <= 0)
            throw new ArgumentException(
                "Refund amount must be greater than zero.",
                nameof(amount));

        if (referenceId == Guid.Empty)
            throw new ArgumentException(
                "Reference ID cannot be empty.",
                nameof(referenceId));

        if (!_transactions.Any(t =>
                t.Type == TransactionType.ReservationCharge &&
                t.ReferenceId == referenceId))
        {
            throw new InvalidOperationException(
                "Cannot refund a reservation that has not been charged.");
        }

        if (_transactions.Any(t =>
                t.Type == TransactionType.Refund &&
                t.ReferenceId == referenceId))
        {
            throw new InvalidOperationException(
                "Refund has already been processed.");
        }

        Balance += amount;

        var transaction = new Transaction(
            amount,
            TransactionType.Refund,
            referenceId);

        _transactions.Add(transaction);
        return transaction;
    }
}