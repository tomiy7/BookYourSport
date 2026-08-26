using StackExchange.Redis;

namespace SearchService.Infrastructure.Caching;

public class RedisGeocodingCache
{
    private readonly IDatabase _database;

    public RedisGeocodingCache(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<(double Latitude, double Longitude)?> GetAsync(
        string address)
    {
        var value = await _database.StringGetAsync(address);

        if (value.IsNullOrEmpty)
            return null;

        var parts = value.ToString().Split(',');

        if (parts.Length != 2)
            return null;

        if (!double.TryParse(parts[0], out var latitude) ||
            !double.TryParse(parts[1], out var longitude))
            return null;

        return (latitude, longitude);
    }

    public async Task SetAsync(
        string address,
        double latitude,
        double longitude,
        TimeSpan expiration)
    {
        var value = $"{latitude},{longitude}";

        await _database.StringSetAsync(
            address,
            value,
            expiration);
    }
}