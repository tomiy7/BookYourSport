using PaymentService.Domain.Services;

namespace PaymentService.Tests.Domain;

public class RefundPolicyTests
{
    // Testira da se ceo iznos refundira kada je otkazivanje najmanje 24 sata pre rezervacije.
    [Fact]
    public void CalculateRefund_ShouldReturnFullAmount_WhenCancelledAtLeast24HoursBefore()
    {
        var policy = new RefundPolicy();

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 19, 18, 0, 0);

        var refund = policy.CalculateRefund(
            100,
            reservationStart,
            cancellationTime);

        Assert.Equal(100, refund);
    }
    // Testira da se vraća polovina iznosa kada se rezervacija otkaže između 12 i 24 sata unapred.
    [Fact]
    public void CalculateRefund_ShouldReturnHalfAmount_WhenCancelledBetween12And24HoursBefore()
    {
        var policy = new RefundPolicy();

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 20, 2, 0, 0);

        var refund = policy.CalculateRefund(
            100,
            reservationStart,
            cancellationTime);

        Assert.Equal(50, refund);
    }
    // Testira da se polovina iznosa refundira kada se rezervacija otkaže tačno 12 sati unapred.
    [Fact]
    public void CalculateRefund_ShouldReturnHalfAmount_WhenCancelledExactly12HoursBefore()
    {
        var policy = new RefundPolicy();

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 20, 6, 0, 0);

        var refund = policy.CalculateRefund(
            100,
            reservationStart,
            cancellationTime);

        Assert.Equal(50, refund);
    }
    // Testira da nema refundacije kada se rezervacija otkaže manje od 12 sati unapred.
    [Fact]
    public void CalculateRefund_ShouldReturnZero_WhenCancelledLessThan12HoursBefore()
    {
        var policy = new RefundPolicy();

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 20, 7, 0, 0);

        var refund = policy.CalculateRefund(
            100,
            reservationStart,
            cancellationTime);

        Assert.Equal(0, refund);
    }
    // Testira da nevalidan originalni iznos izaziva izuzetak.
    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void CalculateRefund_ShouldThrow_WhenOriginalAmountIsNotPositive(
        int originalAmount)
    {
        var policy = new RefundPolicy();

        var reservationStart =
            new DateTime(2026, 8, 20, 18, 0, 0);

        var cancellationTime =
            new DateTime(2026, 8, 19, 18, 0, 0);

        var exception = Assert.Throws<ArgumentException>(
            () => policy.CalculateRefund(
                originalAmount,
                reservationStart,
                cancellationTime));

        Assert.Equal(
            "Original amount must be greater than zero. (Parameter 'originalAmount')",
            exception.Message);
    }
}