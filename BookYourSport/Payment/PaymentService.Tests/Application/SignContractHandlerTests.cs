using PaymentService.Application.Commands.SignContract;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class SignContractHandlerTests
{
    // Testira uspešno potpisivanje ugovora.
    [Fact]
    public async Task Handle_ShouldSignContract()
    {
        var contract = new Contract(
            Guid.NewGuid(),
            "documents/contracts/test-contract.pdf");

        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var authServiceClient = new FakeAuthServiceClient();

        var handler = new SignContractHandler(
            contractRepository,
            authServiceClient);

        var command = new SignContractCommand
        {
            ContractId = contract.Id
        };

        var result = await handler.Handle(command);

        Assert.Equal(
            ContractStatus.Signed,
            result.Status);

        Assert.NotNull(result.SignedAt);
        Assert.True(contractRepository.SaveChangesCalled);
        Assert.True(authServiceClient.ContractSignedNotificationSent);
    }

    // Testira ponašanje kada ugovor ne postoji.
    [Fact]
    public async Task Handle_ShouldThrow_WhenContractDoesNotExist()
    {
        var contractRepository = new FakeContractRepository
        {
            Contract = null
        };

        var authServiceClient = new FakeAuthServiceClient();

        var handler = new SignContractHandler(
            contractRepository,
            authServiceClient);

        var command = new SignContractCommand
        {
            ContractId = Guid.NewGuid()
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Contract was not found.",
            exception.Message);

        Assert.False(contractRepository.SaveChangesCalled);
    }

    // Testira ponašanje kada ugovor već nije u statusu koji dozvoljava potpisivanje.
    // Testira ponašanje kada ugovor nije u statusu PendingSignature.
    [Fact]
    public async Task Handle_ShouldThrow_WhenContractIsNotPendingSignature()
    {
        var contract = new Contract(
            Guid.NewGuid(),
            "documents/contracts/test-contract.pdf");

        contract.Sign();

        var contractRepository = new FakeContractRepository
        {
            Contract = contract
        };

        var authServiceClient = new FakeAuthServiceClient();

        var handler = new SignContractHandler(
            contractRepository,
            authServiceClient);

        var command = new SignContractCommand
        {
            ContractId = contract.Id
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "Contract is not pending signature.",
            exception.Message);

        Assert.False(contractRepository.SaveChangesCalled);
    }

}