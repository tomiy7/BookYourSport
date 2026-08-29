using PaymentService.Tests.Fakes;

using PaymentService.Application.Commands.GenerateContract;
using PaymentService.Application.DTOs;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;
using PaymentService.Tests.Fakes;

namespace PaymentService.Tests.Application;

public class GenerateContractHandlerTests
{
    // Testira uspešno generisanje i čuvanje ugovora.
    [Fact]
    public async Task Handle_ShouldGenerateAndSaveContract()
    {
        // Arrange
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
            contractRepository);

        var command = new GenerateContractCommand
        {
            UserId = userId
        };

        // Act
        var contract = await handler.Handle(command);

        // Assert
        Assert.NotNull(contract);
        Assert.Equal(userId, contract.UserId);

        Assert.Equal(
            "documents/contracts/test-contract.pdf",
            contract.DocumentPath);

        Assert.Equal(
            ContractStatus.PendingSignature,
            contract.Status);

        Assert.NotNull(contractRepository.AddedContract);

        Assert.Equal(
            contract.Id,
            contractRepository.AddedContract.Id);

        Assert.True(
            contractRepository.SaveChangesCalled);
    }

    // Testira ponašanje kada korisnik ne postoji
    [Fact]
    public async Task Handle_ShouldThrow_WhenUserDoesNotExist()
    {
        // Arrange
        var authServiceClient = new FakeAuthServiceClient
        {
            User = null
        };

        var pdfGenerator = new FakePdfContractGenerator();

        var contractRepository = new FakeContractRepository();

        var handler = new GenerateContractHandler(
            pdfGenerator,
            authServiceClient,
            contractRepository);

        var command = new GenerateContractCommand
        {
            UserId = Guid.NewGuid()
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(command));

        Assert.Equal(
            "User was not found.",
            exception.Message);

        Assert.Null(contractRepository.AddedContract);
        Assert.False(contractRepository.SaveChangesCalled);
    }

    [Theory]
    [InlineData("not_requested")]
    [InlineData("requested")]
    [InlineData("rejected")]
    public async Task Handle_ShouldThrow_WhenUserIsNotApproved(string approvalStatus)
    {
        // Arrange
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
            contractRepository);

        var command = new GenerateContractCommand
        {
            UserId = userId
        };
        
        // Act & Assert
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