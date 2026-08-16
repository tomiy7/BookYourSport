namespace PaymentService.Domain.Services;

public class RefundPolicy
{
    public int CalculateRefund(
        int originalAmount,
        DateTime reservationStart,
        DateTime cancellationTime)
    {
        if (originalAmount <= 0)
            throw new ArgumentException(
                "Original amount must be greater than zero.",
                nameof(originalAmount));

        var timeUntilReservation =
            reservationStart - cancellationTime;

        if (timeUntilReservation >= TimeSpan.FromHours(24))
            return originalAmount;

        if (timeUntilReservation >= TimeSpan.FromHours(12))
            return originalAmount / 2;

        return 0;
    }
}