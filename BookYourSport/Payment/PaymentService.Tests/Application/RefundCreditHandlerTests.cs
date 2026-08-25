using PaymentService.Application.Commands.RefundCredit;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using PaymentService.Domain.Services;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class RefundCreditHandlerTests
{
    // Testira uspešnu refundaciju nakon naplate rezervacije.
    [Fact]
    public async Task Handle_ShouldRefund_WhenRefundIsAllowed()
    {
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(
            100,
            Guid.NewGuid());

        account.Charge(
            40,
            reservationId);

        var repository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var refundPolicy = new RefundPolicy();

        var handler = new RefundCreditHandler(
            repository,
            refundPolicy);

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 19, 18, 0, 0);

        var command = new RefundCreditCommand(
            userId,
            40,
            reservationId,
            reservationStart,
            cancellationTime);

        await handler.Handle(command);

        Assert.Equal(
            100,
            account.Balance);

        Assert.NotNull(
            repository.SavedAccount);

        var refundTransaction =
            account.Transactions.Last();

        Assert.Equal(
            40,
            refundTransaction.Amount);

        Assert.Equal(
            reservationId,
            refundTransaction.ReferenceId);
    }
    // Testira da se refundacija ne izvršava kada RefundPolicy vrati nula.
    [Fact]
    public async Task Handle_ShouldNotRefund_WhenRefundIsNotAllowed()
    {
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(
            100,
            Guid.NewGuid());

        account.Charge(
            40,
            reservationId);

        var repository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var refundPolicy = new RefundPolicy();

        var handler = new RefundCreditHandler(
            repository,
            refundPolicy);

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 20, 7, 0, 0);

        var command = new RefundCreditCommand(
            userId,
            40,
            reservationId,
            reservationStart,
            cancellationTime);

        await handler.Handle(command);

        Assert.Equal(
            60,
            account.Balance);

        Assert.Equal(
            2,
            account.Transactions.Count);

        Assert.Null(
            repository.SavedAccount);
    }
    // Testira ponašanje kada kreditni nalog korisnika ne postoji.
    [Fact]
    public async Task Handle_ShouldThrow_WhenCreditAccountDoesNotExist()
    {
        var repository = new FakeCreditAccountRepository
        {
            Account = null
        };

        var refundPolicy = new RefundPolicy();

        var handler = new RefundCreditHandler(
            repository,
            refundPolicy);

        var command = new RefundCreditCommand(
            Guid.NewGuid(),
            100,
            Guid.NewGuid(),
            new DateTime(2026, 8, 20, 18, 0, 0),
            new DateTime(2026, 8, 19, 18, 0, 0));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Credit account not found.",
            exception.Message);

        Assert.Null(repository.SavedAccount);
    }
    // Testira da handler primenjuje delimičan refund koji odredi RefundPolicy.
    [Fact]
    public async Task Handle_ShouldApplyPartialRefund_WhenCancellationIsBetween12And24Hours()
    {
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(
            100,
            Guid.NewGuid());

        account.Charge(
            100,
            reservationId);

        var repository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var refundPolicy = new RefundPolicy();

        var handler = new RefundCreditHandler(
            repository,
            refundPolicy);

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 20, 2, 0, 0);

        var command = new RefundCreditCommand(
            userId,
            100,
            reservationId,
            reservationStart,
            cancellationTime);

        await handler.Handle(command);

        // 16 sati unapred → 50% refund = 50.
        Assert.Equal(
            50,
            account.Balance);

        Assert.NotNull(
            repository.SavedAccount);

        var refundTransaction =
            account.Transactions.Last();

        Assert.Equal(
            TransactionType.Refund,
            refundTransaction.Type);

        Assert.Equal(
            50,
            refundTransaction.Amount);

        Assert.Equal(
            reservationId,
            refundTransaction.ReferenceId);
    }
    // Testira da nije moguće dva puta refundirati istu rezervaciju.
    [Fact]
    public async Task Handle_ShouldThrow_WhenRefundAlreadyProcessed()
    {
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();

        var account = new CreditAccount(userId);

        account.TopUp(
            100,
            Guid.NewGuid());

        account.Charge(
            40,
            reservationId);

        var repository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var refundPolicy = new RefundPolicy();

        var handler = new RefundCreditHandler(
            repository,
            refundPolicy);

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 19, 18, 0, 0);

        var command = new RefundCreditCommand(
            userId,
            40,
            reservationId,
            reservationStart,
            cancellationTime);

        await handler.Handle(command);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Refund has already been processed.",
            exception.Message);

        Assert.Equal(
            100,
            account.Balance);
    }
}