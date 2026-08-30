using ReservationService.Application.Interfaces;

namespace ReservationService.Tests.Fakes;

public class FakePaymentServiceClient : IPaymentServiceClient
{
    public bool ChargeCalled { get; private set; }
    public bool RefundCalled { get; private set; }

    public Guid? LastReservationId { get; private set; }

    public Task ChargeAsync(
        Guid userId,
        decimal amount,
        Guid reservationId)
    {
        ChargeCalled = true;
        LastReservationId = reservationId;

        return Task.CompletedTask;
    }

    public Task RefundAsync(
        Guid userId,
        decimal originalAmount,
        Guid reservationId,
        DateTime reservationStart,
        DateTime cancellationTime)
    {
        RefundCalled = true;
        LastReservationId = reservationId;

        return Task.CompletedTask;
    }
}