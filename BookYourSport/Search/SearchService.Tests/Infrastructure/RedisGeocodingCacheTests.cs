using SearchService.Infrastructure.Caching;
using StackExchange.Redis;

namespace SearchService.Tests.Infrastructure;

public class RedisGeocodingCacheTests
{
    private readonly RedisGeocodingCache _cache;

    public RedisGeocodingCacheTests()
    {
        var redis = ConnectionMultiplexer.Connect("localhost:6380");
        _cache = new RedisGeocodingCache(redis);
    }

    [Fact]
    public async Task SetAsync_ThenGetAsync_ReturnsCoordinates()
    {
        // Arrange
        var address = $"test-address-{Guid.NewGuid()}";
        var latitude = 44.8125;
        var longitude = 20.4612;

        // Act
        await _cache.SetAsync(
            address,
            latitude,
            longitude,
            TimeSpan.FromMinutes(5));

        var result = await _cache.GetAsync(address);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(latitude, result.Value.Latitude);
        Assert.Equal(longitude, result.Value.Longitude);
    }
    [Fact]
    public async Task GetAsync_WhenAddressDoesNotExist_ReturnsNull()
    {
        // Arrange
        var address = $"non-existing-{Guid.NewGuid()}";

        // Act
        var result = await _cache.GetAsync(address);

        // Assert
        Assert.Null(result);
    }

}