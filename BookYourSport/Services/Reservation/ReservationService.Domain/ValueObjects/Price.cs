using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.Domain.ValueObjects;

public class Price : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    
    private Price() { Amount = 0; Currency = "RSD"; }

    private Price(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static Price Create(decimal amount, string currency)
    {
       if (amount < 0)
           throw new ReservationDomainException("Amount must be greater than or equal to zero");
       if (string.IsNullOrWhiteSpace(currency))
           throw new ReservationDomainException("Currency must be specified");
       
       return new Price(amount, currency.ToUpperInvariant());
    }
    
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
    
    public override string ToString() => $"{Amount} {Currency}";
}