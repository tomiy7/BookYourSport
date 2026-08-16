using PaymentService.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace PaymentService.Domain.Entities
{
    public class CreditAccount
    {
        public CreditAccount(Guid userId)
        {
            if (userId == Guid.Empty)
                throw new ArgumentException("User ID cannot be empty.", nameof(userId));

            Id = Guid.NewGuid();
            UserId = userId;
            Balance = 0;
        }
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public int Balance { get; private set; }
        private readonly List<Transaction> _transactions = new();
        public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();
        public void TopUp(int amount, Guid? referenceId)
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
        public void Charge(int amount, Guid referenceId)
        {
            if (amount <= 0)
                throw new ArgumentException(
                    "Charge amount must be greater than zero.",
                    nameof(amount));

            if (Balance < amount)
                throw new InvalidOperationException(
                    "Insufficient credit.");

            Balance -= amount;

            var transaction = new Transaction(
                amount,
                TransactionType.ReservationCharge,
                referenceId);

            _transactions.Add(transaction);
        }
        public void Refund(int amount, Guid referenceId)
        {
            if (amount <= 0)
                throw new ArgumentException(
                    "Refund amount must be greater than zero.",
                    nameof(amount));

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
        }

    }
}
