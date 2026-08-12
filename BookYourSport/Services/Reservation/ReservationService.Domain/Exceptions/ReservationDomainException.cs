namespace ReservationService.Domain.Exceptions;

public class ReservationDomainException : Exception
{
    public ReservationDomainException() { }
    
    public ReservationDomainException(string message) : base(message) { }
    
    public ReservationDomainException(string message, Exception innerException) : base(message, innerException) { }
}