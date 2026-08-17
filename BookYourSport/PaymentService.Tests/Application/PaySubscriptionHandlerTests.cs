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
}