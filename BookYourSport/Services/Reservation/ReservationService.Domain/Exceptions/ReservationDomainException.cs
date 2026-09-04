namespace ReservationService.Domain.Exceptions;

public class ReservationDomainException : Exception
{
    public string? ErrorCode { get; }

    public ReservationDomainException() { }

    public ReservationDomainException(string message) : base(message) { }

    public ReservationDomainException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }

    public ReservationDomainException(string message, Exception innerException) : base(message, innerException) { }
}