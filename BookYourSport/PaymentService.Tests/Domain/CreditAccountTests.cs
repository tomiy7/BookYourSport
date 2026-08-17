using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;

namespace PaymentService.Tests.Domain;

public class CreditAccountTests
{
    // Testira da Charge smanjuje stanje kreditnog naloga.
    [Fact]
    public void Charge_ShouldDecreaseBalance()
    {
        var account = new CreditAccount(Guid.NewGuid());

        account.TopUp(100, Guid.NewGuid());

        account.Charge(
            40,
            Guid.NewGuid());

        Assert.Equal(60, account.Balance);
    }
}