namespace ReservationService.Domain.Common;

public abstract class ValueObject
{
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType()) return false;

        var other = (ValueObject)obj;

        return this.GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }
    
    public override int GetHashCode() =>
        GetEqualityComponents().Aggregate(1, (hash, c) => HashCode.Combine(hash, c));
    
    public static bool operator ==(ValueObject? left, ValueObject? right) =>
        left is null ? right is null : left.Equals(right);
    
    public static bool operator !=(ValueObject? left, ValueObject? right) =>
        !(left == right);
    
    public ValueObject GetCopy() => (ValueObject)MemberwiseClone();
}