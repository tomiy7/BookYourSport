using System;

namespace PaymentService.Domain.ValueObjects
{
    public sealed class Money: IEquatable<Money>
    {
        public decimal Amount { get; }
        public string Currency { get; }
        public Money(decimal amount, string currency)
        {
            if (amount < 0)
                throw new ArgumentException("Money amount cannot be negative.", nameof(amount));

            if (string.IsNullOrWhiteSpace(currency))
                throw new ArgumentException("Currency cannot be empty.", nameof(currency));
            currency = currency.Trim().ToUpperInvariant();
            Amount = amount;
            Currency = currency;
        }
        public bool Equals(Money? other)
        {
            if (other is null)
                return false;

            return Amount == other.Amount &&
                   Currency == other.Currency;
        }
        public override bool Equals(object? obj)
        {
            return obj is Money other && Equals(other);
        }
        public override int GetHashCode()
        {
            return HashCode.Combine(Amount, Currency);
        }
        private void EnsureSameCurrency(Money other)
        {
            if (other is null)
                throw new ArgumentNullException(nameof(other));

            if (Currency != other.Currency)
                throw new InvalidOperationException("Currencies must match.");
        }
        public Money Add(Money other)
        {
            EnsureSameCurrency(other);

            return new Money(Amount + other.Amount, Currency);
        }
        public Money Subtract(Money other)
        {
            EnsureSameCurrency(other);

            if (other.Amount > Amount)
                throw new InvalidOperationException("Money amount cannot be negative.");

            return new Money(Amount - other.Amount, Currency);
        }
        public bool IsZero()
        {
            return Amount == 0;
        }

        public bool IsGreaterThan(Money other)
        {
            EnsureSameCurrency(other);

            return Amount > other.Amount;
        }

    }
}
