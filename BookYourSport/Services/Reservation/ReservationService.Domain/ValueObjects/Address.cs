using ReservationService.Domain.Common;
using ReservationService.Domain.Exceptions;

namespace ReservationService.Domain.ValueObjects;

public class Address : ValueObject
{
    public string City { get; private set; }
    public string? Municipality { get; private set; }
    public string? ZipCode { get; private set; }
    public string Street { get; private set; }
    public string Country { get; private set; }
    public string StreetNumber { get; private set; }
    
    private Address() { City = string.Empty; Street = string.Empty; Country = string.Empty; StreetNumber = string.Empty; }

    private Address(string city, string? municipality, string? zipCode, string street, string country, string streetNumber)
    {
        City = city;
        Municipality = municipality;
        ZipCode = zipCode;
        Street = street;
        Country = country;
        StreetNumber = streetNumber;
    }

    public static Address Create(string city, string? municipality, string? zipCode, string street, string country,
        string streetNumber)
    {
        if (string.IsNullOrWhiteSpace(city))
            throw new ReservationDomainException("City is mandatory.");
        if (string.IsNullOrWhiteSpace(street))
            throw new ReservationDomainException("Street is mandatory.");
        if (string.IsNullOrWhiteSpace(streetNumber))
            throw new ReservationDomainException("Street number is mandatory.");
        if (string.IsNullOrWhiteSpace(country))
            throw new ReservationDomainException("Country is mandatory.");
        
        return new Address(city.Trim(), municipality?.Trim(), zipCode?.Trim(), street.Trim(), country.Trim(), streetNumber.Trim());
    } 
    
    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return City;
        yield return Municipality;
        yield return ZipCode;
        yield return Street;
        yield return Country;
        yield return StreetNumber;
    }
}