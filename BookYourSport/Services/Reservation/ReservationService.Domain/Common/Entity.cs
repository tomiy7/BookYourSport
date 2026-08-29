namespace ReservationService.Domain.Common;

public abstract class Entity
{
    public Guid Id { get; protected  set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? LastModifiedBy { get; set; }
    public DateTime LastModifiedDate { get; set; }
}