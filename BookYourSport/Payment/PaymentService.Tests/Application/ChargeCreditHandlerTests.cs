using PaymentService.Application.Commands.ChargeCredit;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class ChargeCreditHandlerTests
{
    // Testira uspešno naplaćivanje rezervacije sa kreditnog naloga.
    [Fact]
    public async Task Handle_ShouldChargeCredit()
    {
        var userId = Guid.NewGuid();
        var referenceId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(100, Guid.NewGuid());

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var handler = new ChargeCreditHandler(
            creditAccountRepository,
            new FakeOutboxWriter());

        var command = new ChargeCreditCommand(
            userId,
            40,
            referenceId);

        await handler.Handle(command);

        Assert.NotNull(
            creditAccountRepository.SavedAccount);

        Assert.Equal(
            60,
            account.Balance);

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
    // Testira da se naplata odbija kada korisnik nema dovoljno kredita.
    [Fact]
    public async Task Handle_ShouldThrow_WhenCreditIsInsufficient()
    {
        var userId = Guid.NewGuid();
        var referenceId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(50, Guid.NewGuid());

        var repository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var handler = new ChargeCreditHandler(
            repository,
            new FakeOutboxWriter());

        var command = new ChargeCreditCommand(
            userId,
            100,
            referenceId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Insufficient credit.",
            exception.Message);

        Assert.Equal(50, account.Balance);
        Assert.False(
            repository.SavedAccount != null);
    }
    // Testira ponašanje kada kreditni nalog korisnika ne postoji.
    [Fact]
    public async Task Handle_ShouldThrow_WhenCreditAccountDoesNotExist()
    {
        var repository = new FakeCreditAccountRepository
        {
            Account = null
        };

        var handler = new ChargeCreditHandler(
            repository,
            new FakeOutboxWriter());

        var command = new ChargeCreditCommand(
            Guid.NewGuid(),
            100,
            Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Credit account not found.",
            exception.Message);

        Assert.Null(repository.SavedAccount);
    }
    // Testira da nevalidan iznos charge-a izaziva izuzetak.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task Handle_ShouldThrow_WhenAmountIsNotPositive(
        int amount)
    {
        var repository = new FakeCreditAccountRepository();

        var handler = new ChargeCreditHandler(
            repository,
            new FakeOutboxWriter());

        var command = new ChargeCreditCommand(
            Guid.NewGuid(),
            amount,
            Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Charge amount must be greater than zero. (Parameter 'Amount')",
            exception.Message);

        Assert.Null(repository.SavedAccount);
    }
}