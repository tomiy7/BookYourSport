using PaymentService.Application.Commands.TopUpCredit;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class TopUpCreditHandlerTests
{
    // Testira uspešan top-up postojećeg kreditnog naloga.
    [Fact]
    public async Task Handle_ShouldTopUpExistingAccount()
    {
        var userId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var paymentId = Guid.NewGuid();

        var paymentProcessor = new FakePaymentProcessor
        {
            Result = new PaymentResult
            {
                IsSuccessful = true,
                PaymentId = paymentId
            }
        };

        var handler = new TopUpCreditHandler(
            paymentProcessor,
            creditAccountRepository);

        var command = new TopUpCreditCommand(
            userId,
            100,
            "EUR");

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccessful);
        Assert.Equal(paymentId, result.PaymentId);

        Assert.NotNull(creditAccountRepository.SavedAccount);
        Assert.Equal(100, account.Balance);

        var transaction = Assert.Single(account.Transactions);

        Assert.Equal(
            TransactionType.TopUp,
            transaction.Type);

        Assert.Equal(
            100,
            transaction.Amount);

        Assert.Equal(
            paymentId,
            transaction.ReferenceId);
    }
    // Testira top-up kada korisnik još nema kreditni nalog.
    [Fact]
    public async Task Handle_ShouldCreateAccount_WhenAccountDoesNotExist()
    {
        var userId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = null
        };

        var paymentProcessor = new FakePaymentProcessor
        {
            Result = new PaymentResult
            {
                IsSuccessful = true,
                PaymentId = paymentId
            }
        };

        var handler = new TopUpCreditHandler(
            paymentProcessor,
            creditAccountRepository);

        var command = new TopUpCreditCommand(
            userId,
            100,
            "EUR");

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccessful);

        Assert.NotNull(creditAccountRepository.SavedAccount);

        var account = creditAccountRepository.SavedAccount!;

        Assert.Equal(userId, account.UserId);
        Assert.Equal(100, account.Balance);

        var transaction = Assert.Single(account.Transactions);

        Assert.Equal(
            TransactionType.TopUp,
            transaction.Type);

        Assert.Equal(
            100,
            transaction.Amount);

        Assert.Equal(
            paymentId,
            transaction.ReferenceId);
    }
    // Testira da neuspešna uplata ne menja kreditni nalog.
    [Fact]
    public async Task Handle_ShouldNotTopUp_WhenPaymentFails()
    {
        var userId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var paymentProcessor = new FakePaymentProcessor
        {
            Result = new PaymentResult
            {
                IsSuccessful = false,
                PaymentId = Guid.NewGuid()
            }
        };

        var handler = new TopUpCreditHandler(
            paymentProcessor,
            creditAccountRepository);

        var command = new TopUpCreditCommand(
            userId,
            100,
            "EUR");

        var result = await handler.Handle(command);

        Assert.False(result.IsSuccessful);

        Assert.Equal(0, account.Balance);
        Assert.Empty(account.Transactions);

        Assert.Null(creditAccountRepository.SavedAccount);
    }
    // Testira da nevalidan iznos top-up-a izaziva izuzetak.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task Handle_ShouldThrow_WhenAmountIsNotPositive(
        int amount)
    {
        var userId = Guid.NewGuid();

        var creditAccountRepository = new FakeCreditAccountRepository();

        var paymentProcessor = new FakePaymentProcessor();

        var handler = new TopUpCreditHandler(
            paymentProcessor,
            creditAccountRepository);

        var command = new TopUpCreditCommand(
            userId,
            amount,
            "EUR");

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Top-up amount must be greater than zero. (Parameter 'Amount')",
            exception.Message);

        Assert.Null(creditAccountRepository.SavedAccount);
    }
}