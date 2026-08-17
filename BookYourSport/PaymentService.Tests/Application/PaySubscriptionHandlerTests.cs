using PaymentService.Application.Commands.PaySubscription;
using PaymentService.Application.Interfaces;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class PaySubscriptionHandlerTests
{
    // Testira uspešnu uplatu pretplate za korisnika sa potpisanim ugovorom.
    [Fact]
    public async Task Handle_ShouldProcessSuccessfulPayment()
    {
        var userId = Guid.NewGuid();

        var contract = new PaymentService.Domain.Contract.Contract(
            userId,
            "documents/contracts/test-contract.pdf");

        contract.Sign();

        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var paymentProcessor = new FakePaymentProcessor();

        var authServiceClient = new FakeAuthServiceClient();

        var handler = new PaySubscriptionHandler(
            paymentProcessor,
            authServiceClient,
            contractRepository);

        var command = new PaySubscriptionCommand(
            userId,
            100,
            "EUR");

        var result = await handler.Handle(command);

        Assert.True(result.IsSuccessful);
        Assert.NotEqual(Guid.Empty, result.PaymentId);

        Assert.True(
            authServiceClient.SubscriptionPaidNotificationSent);
    }
    // Testira ponašanje kada ugovor korisnika ne postoji.
    [Fact]
    public async Task Handle_ShouldThrow_WhenContractDoesNotExist()
    {
        var userId = Guid.NewGuid();

        var contractRepository = new FakeContractRepository
        {
            Contract = null
        };

        var paymentProcessor = new FakePaymentProcessor();
        var authServiceClient = new FakeAuthServiceClient();

        var handler = new PaySubscriptionHandler(
            paymentProcessor,
            authServiceClient,
            contractRepository);

        var command = new PaySubscriptionCommand(
            userId,
            100,
            "EUR");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Contract was not found.",
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

        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var paymentProcessor = new FakePaymentProcessor();
        var authServiceClient = new FakeAuthServiceClient();

        var handler = new PaySubscriptionHandler(
            paymentProcessor,
            authServiceClient,
            contractRepository);

        var command = new PaySubscriptionCommand(
            userId,
            100,
            "EUR");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Contract must be signed before subscription payment.",
            exception.Message);
    }
    // Testira da se Auth Service ne obaveštava kada uplata nije uspešna.
    [Fact]
    public async Task Handle_ShouldNotNotifyAuth_WhenPaymentFails()
    {
        var userId = Guid.NewGuid();

        var contract = new PaymentService.Domain.Contract.Contract(
            userId,
            "documents/contracts/test-contract.pdf");

        contract.Sign();

        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var paymentProcessor = new FakePaymentProcessor
        {
            Result = new PaymentResult
            {
                IsSuccessful = false,
                PaymentId = Guid.NewGuid()
            }
        };

        var authServiceClient = new FakeAuthServiceClient();

        var handler = new PaySubscriptionHandler(
            paymentProcessor,
            authServiceClient,
            contractRepository);

        var command = new PaySubscriptionCommand(
            userId,
            100,
            "EUR");

        var result = await handler.Handle(command);

        Assert.False(result.IsSuccessful);

        Assert.False(
            authServiceClient.SubscriptionPaidNotificationSent);
    }
    // Testira da nevalidan iznos pretplate izaziva izuzetak.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task Handle_ShouldThrow_WhenAmountIsNotPositive(
        decimal amount)
    {
        var handler = new PaySubscriptionHandler(
            new FakePaymentProcessor(),
            new FakeAuthServiceClient(),
            new FakeContractRepository());

        var command = new PaySubscriptionCommand(
            Guid.NewGuid(),
            amount,
            "EUR");

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Subscription amount must be greater than zero. (Parameter 'Amount')",
            exception.Message);
    }
}