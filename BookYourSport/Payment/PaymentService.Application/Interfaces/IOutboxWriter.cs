namespace PaymentService.Application.Interfaces;

public interface IOutboxWriter
{
    void Add<T>(T eventMessage);
}