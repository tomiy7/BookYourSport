using ReservationService.Domain.Exceptions;
using ReservationService.Domain.ValueObjects;
using Xunit;

namespace ReservationService.Tests.Domain;

public class PriceTests
{
    [Fact]
    public void Create_WithValidAmount_Succeeds()
    {
        var price = Price.Create(1500m);

        Assert.Equal(1500m, price.Amount);
        Assert.Equal("RSD", price.Currency);
    }

    [Fact]
    public void Create_WithNegativeAmount_Throws()
    {
        Assert.Throws<ReservationDomainException>(() => Price.Create(-100m));
    }

    [Fact]
    public void Create_WithZero_Succeeds()
    {
        var price = Price.Create(0m);

        Assert.Equal(0m, price.Amount);
    }

    [Fact]
    public void Multiply_ReturnsNewInstanceWithScaledAmount()
    {
        var original = Price.Create(1500m);

        var doubled = original.Multiply(2);

        Assert.Equal(3000m, doubled.Amount);
        Assert.Equal(1500m, original.Amount); 
    }

    [Fact]
    public void Equals_SameAmountAndCurrency_AreEqual()
    {
        var a = Price.Create(1500m, "RSD");
        var b = Price.Create(1500m, "RSD");

        Assert.Equal(a, b);
        Assert.True(a == b);
    }

    [Fact]
    public void Equals_DifferentAmount_AreNotEqual()
    {
        var a = Price.Create(1500m);
        var b = Price.Create(2000m);

        Assert.NotEqual(a, b);
    }
}

public class AddressTests
{
    [Fact]
    public void Create_WithValidData_Succeeds()
    {
        var address = Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "15");

        Assert.Equal("Beograd", address.City);
        Assert.Equal("15", address.StreetNumber);
    }

    [Fact]
    public void Create_WithEmptyCity_Throws()
    {
        Assert.Throws<ReservationDomainException>(() =>
            Address.Create("", "Zemun", "11080", "Cara Dusana", "Serbia", "15"));
    }

    [Fact]
    public void Create_WithEmptyStreet_Throws()
    {
        Assert.Throws<ReservationDomainException>(() =>
            Address.Create("Beograd", "Zemun", "11080", "", "Serbia", "15"));
    }

    [Fact]
    public void Create_WithoutOptionalMunicipality_Succeeds()
    {
        var address = Address.Create("Beograd", null, null, "Cara Dusana", "Serbia", "15");

        Assert.Null(address.Municipality);
    }

    [Fact]
    public void Equals_SameValues_AreEqual()
    {
        var a = Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "15");
        var b = Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "15");

        Assert.Equal(a, b);
    }

    [Fact]
    public void Equals_DifferentStreetNumber_AreNotEqual()
    {
        var a = Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "15");
        var b = Address.Create("Beograd", "Zemun", "11080", "Cara Dusana", "Serbia", "16");

        Assert.NotEqual(a, b);
    }
}
