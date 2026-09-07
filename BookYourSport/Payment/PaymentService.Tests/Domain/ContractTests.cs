using PaymentService.Domain.Contract;

namespace PaymentService.Tests.Domain;

public class ContractTests
{
    [Fact]
    public void Sign_ShouldChangeStatusToSigned()
    {
        // Arrange
        var contract = new Contract(
            Guid.NewGuid(),
            "documents/test-contract.pdf");

        // Act
        contract.Sign();

        // Assert
        Assert.Equal(
            ContractStatus.Signed,
            contract.Status);
    }
    [Fact]
    public void Sign_ShouldSetSignedAt()
    {
        // Arrange
        var contract = new Contract(
            Guid.NewGuid(),
            "documents/test-contract.pdf");

        // Act
        contract.Sign();

        // Assert
        Assert.NotNull(contract.SignedAt);
    }
    [Fact]
    public void Sign_ShouldThrow_WhenContractIsAlreadySigned()
    {
        // Arrange
        var contract = new Contract(
            Guid.NewGuid(),
            "documents/test-contract.pdf");

        contract.Sign();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(
            () => contract.Sign());
    }
}