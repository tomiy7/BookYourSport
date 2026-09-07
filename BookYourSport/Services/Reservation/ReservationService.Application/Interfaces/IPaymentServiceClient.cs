namespace ReservationService.Application.Interfaces;

public interface IPaymentServiceClient
{
    Task ChargeAsync(
        Guid userId,
        decimal amount,
        Guid reservationId);

    Task RefundAsync(
        Guid userId,
        decimal originalAmount,
        Guid reservationId,
        DateTime reservationStart,
        DateTime cancellationTime);
}