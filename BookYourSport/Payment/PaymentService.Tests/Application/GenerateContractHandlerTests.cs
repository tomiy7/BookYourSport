using PaymentService.Tests.Fakes;

using PaymentService.Application.Commands.GenerateContract;
using PaymentService.Application.Common;
using PaymentService.Application.DTOs;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Tests.Application;

public class GenerateContractHandlerTests
{
    private static SubscriptionSettings Settings() => new()
    {
        Amount = 3000,
        Currency = "RSD"
    };

    [Fact]
    public async Task Handle_ShouldGenerateAndSaveContract()
    {
        var userId = Guid.NewGuid();

        var authServiceClient = new FakeAuthServiceClient
        {
            User = new AuthUserDto
            {
                Id = userId,
                FirstName = "Test",
                LastName = "ClubOwner",
                ApprovalStatus = "approved"
            }
        };

        var pdfGenerator = new FakePdfContractGenerator();
        var contractRepository = new FakeContractRepository();

        var handler = new GenerateContractHandler(
            pdfGenerator,
            authServiceClient,
            contractRepository,
            Settings());

        var command = new GenerateContractCommand
        {
            UserId = userId
        };

        var contract = await handler.Handle(command);

        Assert.NotNull(contract);
        Assert.Equal(userId, contract.UserId);
        Assert.Equal("documents/contracts/test-contract.pdf", contract.DocumentPath);
        Assert.Equal(ContractStatus.PendingSignature, contract.Status);
        Assert.NotNull(contractRepository.AddedContract);
        Assert.Equal(contract.Id, contractRepository.AddedContract.Id);
        Assert.True(contractRepository.SaveChangesCalled);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenUserDoesNotExist()
    {
        var authServiceClient = new FakeAuthServiceClient
        {
            User = null
        };

        var pdfGenerator = new FakePdfContractGenerator();
        var contractRepository = new FakeContractRepository();

        var handler = new GenerateContractHandler(
            pdfGenerator,
            authServiceClient,
            contractRepository,
            Settings());

        var command = new GenerateContractCommand
        {
            UserId = Guid.NewGuid()
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal("User was not found.", exception.Message);
        Assert.Null(contractRepository.AddedContract);
        Assert.False(contractRepository.SaveChangesCalled);
    }

    [Theory]
    [InlineData("not_requested")]
    [InlineData("requested")]
    [InlineData("rejected")]
    public async Task Handle_ShouldThrow_WhenUserIsNotApproved(string approvalStatus)
    {
        var userId = Guid.NewGuid();

        var authServiceClient = new FakeAuthServiceClient
        {
            User = new AuthUserDto
            {
                Id = userId,
                FirstName = "Test",
                LastName = "ClubOwner",
                ApprovalStatus = approvalStatus
            }
        };

        var pdfGenerator = new FakePdfContractGenerator();
        var contractRepository = new FakeContractRepository();

        var handler = new GenerateContractHandler(
            pdfGenerator,
            authServiceClient,
            contractRepository,
            Settings());

        var command = new GenerateContractCommand
        {
            UserId = userId
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "User must be approved by an admin before a contract can be generated.",
            exception.Message);

        Assert.Null(contractRepository.AddedContract);
        Assert.False(contractRepository.SaveChangesCalled);
        Assert.False(authServiceClient.ContractGeneratedNotificationSent);
    }
}