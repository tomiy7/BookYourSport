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
    // Testira da Charge kreira ReservationCharge transakciju.
    [Fact]
    public void Charge_ShouldCreateReservationChargeTransaction()
    {
        var account = new CreditAccount(Guid.NewGuid());

        account.TopUp(100, Guid.NewGuid());

        var referenceId = Guid.NewGuid();

        account.Charge(40, referenceId);

        var transaction = account.Transactions.Last();

        Assert.Equal(
            TransactionType.ReservationCharge,
            transaction.Type);

        Assert.Equal(
            40,
            transaction.Amount);

        Assert.Equal(
            referenceId,
            transaction.ReferenceId);
    }
    // Testira da Charge ne dozvoljava naplatu veću od raspoloživog kredita.
    [Fact]
    public void Charge_ShouldThrow_WhenCreditIsInsufficient()
    {
        var account = new CreditAccount(Guid.NewGuid());

        account.TopUp(50, Guid.NewGuid());

        var exception = Assert.Throws<InvalidOperationException>(
            () => account.Charge(
                100,
                Guid.NewGuid()));

        Assert.Equal(
            "Insufficient credit.",
            exception.Message);

        Assert.Equal(50, account.Balance);
    }
    // Testira da Charge ne dozvoljava nepozitivan iznos.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Charge_ShouldThrow_WhenAmountIsNotPositive(int amount)
    {
        var account = new CreditAccount(Guid.NewGuid());

        account.TopUp(100, Guid.NewGuid());

        var exception = Assert.Throws<ArgumentException>(
            () => account.Charge(
                amount,
                Guid.NewGuid()));

        Assert.Equal(
            "Charge amount must be greater than zero. (Parameter 'amount')",
            exception.Message);

        Assert.Equal(100, account.Balance);
    }
    
    // Testira kompletan tok top-up-a, naplate rezervacije i refundacije.
    [Fact]
    public void Refund_ShouldRestoreBalanceAfterCharge()
    {
        var account = new CreditAccount(Guid.NewGuid());

        var paymentId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();

        account.TopUp(100, paymentId);

        account.Charge(40, reservationId);

        account.Refund(40, reservationId);

        Assert.Equal(100, account.Balance);

        Assert.Equal(3, account.Transactions.Count);

        var refundTransaction = account.Transactions.Last();

        Assert.Equal(
            TransactionType.Refund,
            refundTransaction.Type);

        Assert.Equal(
            40,
            refundTransaction.Amount);

        Assert.Equal(
            reservationId,
            refundTransaction.ReferenceId);
    }
    // Testira da nije moguće dva puta refundirati istu rezervaciju.
    [Fact]
    public void Refund_ShouldThrow_WhenRefundAlreadyProcessed()
    {
        var account = new CreditAccount(Guid.NewGuid());

        var reservationId = Guid.NewGuid();

        account.TopUp(100, Guid.NewGuid());

        account.Charge(40, reservationId);

        account.Refund(40, reservationId);

        var exception = Assert.Throws<InvalidOperationException>(
            () => account.Refund(40, reservationId));

        Assert.Equal(
            "Refund has already been processed.",
            exception.Message);

        Assert.Equal(100, account.Balance);
    }
    // Testira da Refund ne dozvoljava nepozitivan iznos.
    [Theory]
    [InlineData(0)]
    [InlineData(-40)]
    public void Refund_ShouldThrow_WhenAmountIsNotPositive(int amount)
    {
        var account = new CreditAccount(Guid.NewGuid());

        account.TopUp(100, Guid.NewGuid());

        var reservationId = Guid.NewGuid();

        account.Charge(40, reservationId);

        var exception = Assert.Throws<ArgumentException>(
            () => account.Refund(
                amount,
                reservationId));

        Assert.Equal(
            "Refund amount must be greater than zero. (Parameter 'amount')",
            exception.Message);

        Assert.Equal(60, account.Balance);
    }
}