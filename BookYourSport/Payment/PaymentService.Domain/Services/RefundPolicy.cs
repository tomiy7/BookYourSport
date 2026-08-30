namespace PaymentService.Domain.Services;

// Defines refund rules based on the time between cancellation and reservation start.
public class RefundPolicy
{
    public decimal CalculateRefund(
        decimal originalAmount,
        DateTime reservationStart,
        DateTime cancellationTime)
    {
        if (originalAmount <= 0)
            throw new ArgumentException(
                "Original amount must be greater than zero.",
                nameof(originalAmount));

        var timeUntilReservation =
            reservationStart - cancellationTime;

        // Full refund when the reservation is cancelled at least 24 hours in advance.
        if (timeUntilReservation >= TimeSpan.FromHours(24))
            return originalAmount;

        // Half refund when the reservation is cancelled between 12 and 24 hours in advance.
        if (timeUntilReservation >= TimeSpan.FromHours(12))
            return originalAmount / 2;

        // No refund when the reservation is cancelled less than 12 hours in advance.
        return 0;
    }
}