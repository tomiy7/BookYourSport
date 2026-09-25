using PaymentService.Application.Commands.PaySubscription;
using PaymentService.Application.Common;
using PaymentService.Domain.Entities;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class PaySubscriptionHandlerTests
{
    private static SubscriptionSettings Settings() => new()
    {
        Amount = 3000,
        Currency = "RSD"
    };

    private static FakeContractRepository SignedContractRepo(Guid userId)
    {
        var contract = new PaymentService.Domain.Contract.Contract(
            userId,
            "documents/contracts/test-contract.pdf");

        contract.Sign();

        return new FakeContractRepository { Contract = contract };
    }

    // Testira uspešnu uplatu pretplate za korisnika sa potpisanim ugovorom.
    [Fact]
    public async Task Handle_ShouldProcessSuccessfulPayment()
    {
        var userId = Guid.NewGuid();

        var contractRepository = SignedContractRepo(userId);

        var account = new CreditAccount(userId);
        account.TopUp(5000, Guid.NewGuid());

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var authServiceClient = new FakeAuthServiceClient
        {
            User = new PaymentService.Application.DTOs.AuthUserDto
            {
                Id = userId,
                FirstName = "Test",
                LastName = "ClubOwner",
                ApprovalStatus = "approved"
            }
        };

        var handler = new PaySubscriptionHandler(
            authServiceClient,
            contractRepository,
            creditAccountRepository,
            Settings());

        var command = new PaySubscriptionCommand(userId);

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccessful);
        Assert.NotEqual(Guid.Empty, result.PaymentId);
        Assert.Equal(2000, account.Balance);
        Assert.True(authServiceClient.SubscriptionPaidNotificationSent);
    }

    // Testira ponašanje kada potpisan ugovor korisnika ne postoji.
    [Fact]
    public async Task Handle_ShouldThrow_WhenSignedContractDoesNotExist()
    {
        var userId = Guid.NewGuid();

        var contractRepository = new FakeContractRepository
        {
            Contract = null
        };

        var handler = new PaySubscriptionHandler(
            new FakeAuthServiceClient(),
            contractRepository,
            new FakeCreditAccountRepository(),
            Settings());

        var command = new PaySubscriptionCommand(userId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "A signed contract was not found.",
            exception.Message);
    }

    // Testira da uplata pretplate nije dozvoljena dok ugovor nije potpisan.
    [Fact]
    public async Task Handle_ShouldThrow_WhenContractIsNotSigned()
    {
        var userId = Guid.NewGuid();

        var contract = new PaymentService.Domain.Contract.Contract(
            userId,
            "documents/contracts/test-contract.pdf");

        // Ugovor postoji, ali nije potpisan -> GetSignedByUserIdAsync vraća null.
        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var handler = new PaySubscriptionHandler(
            new FakeAuthServiceClient(),
            contractRepository,
            new FakeCreditAccountRepository(),
            Settings());

        var command = new PaySubscriptionCommand(userId);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "A signed contract was not found.",
            exception.Message);
    }

    // Testira da se Auth Service ne obaveštava kada nema dovoljno sredstava.
    [Fact]
    public async Task Handle_ShouldNotNotifyAuth_WhenBalanceIsInsufficient()
    {
        var userId = Guid.NewGuid();

        var contractRepository = SignedContractRepo(userId);

        var account = new CreditAccount(userId);
        account.TopUp(1000, Guid.NewGuid());

        var creditAccountRepository = new FakeCreditAccountRepository
        {
            Account = account
        };

        var authServiceClient = new FakeAuthServiceClient
        {
            User = new PaymentService.Application.DTOs.AuthUserDto
            {
                Id = userId,
                FirstName = "Test",
                LastName = "ClubOwner",
                ApprovalStatus = "approved"
            }
        };

        var handler = new PaySubscriptionHandler(
            authServiceClient,
            contractRepository,
            creditAccountRepository,
            Settings());

        var command = new PaySubscriptionCommand(userId);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.False(authServiceClient.SubscriptionPaidNotificationSent);
    }

    // Testira da nevalidna (backend) cena pretplate izaziva izuzetak.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task Handle_ShouldThrow_WhenSubscriptionAmountIsNotPositive(
        decimal amount)
    {
        var handler = new PaySubscriptionHandler(
            new FakeAuthServiceClient(),
            new FakeContractRepository(),
            new FakeCreditAccountRepository(),
            new SubscriptionSettings { Amount = amount, Currency = "RSD" });

        var command = new PaySubscriptionCommand(Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Subscription amount must be greater than zero.",
            exception.Message);
    }
}