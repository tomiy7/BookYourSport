using SearchService.Infrastructure.Caching;
using SearchService.Infrastructure.Geocoding;
using StackExchange.Redis;

namespace SearchService.Tests.Infrastructure;

public class GeocodingServiceTests
{
    [Fact]
    public async Task GeocodeAsync_CachesResultInRedis()
    {
        // Arrange
        var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6380");
        var cache = new RedisGeocodingCache(redis);

        const string address = "Gajeva 10, Beograd, Serbia";

        await redis.GetDatabase().KeyDeleteAsync(address);

        using var httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://nominatim.openstreetmap.org/")
        };

        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
            "BookYourSport-SearchService/1.0");

        var service = new GeocodingService(httpClient, cache);

        // Act
        var result = await service.GeocodeAsync(address);

        // Assert
        Assert.NotNull(result);

        var cached = await cache.GetAsync(address);

        Assert.NotNull(cached);
        Assert.Equal(result.Latitude, cached.Value.Latitude);
        Assert.Equal(result.Longitude, cached.Value.Longitude);
    }

    [Fact]
    public async Task GeocodeAsync_WhenResultIsCached_ReturnsCachedResult()
    {
        // Arrange
        var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6380");
        var cache = new RedisGeocodingCache(redis);

        const string address = "Cached address";

        await cache.SetAsync(
            address,
            44.7993846,
            20.4871742,
            TimeSpan.FromMinutes(5));

        using var httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://nominatim.openstreetmap.org/")
        };

        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
            "BookYourSport-SearchService/1.0");

        var service = new GeocodingService(httpClient, cache);

        // Act
        var result = await service.GeocodeAsync(address);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(44.7993846, result.Latitude);
        Assert.Equal(20.4871742, result.Longitude);
    }


    [Fact]
    public async Task GeocodeAsync_WhenAddressIsNotFound_ReturnsNull()
    {
        // Arrange
        var redis = await ConnectionMultiplexer.ConnectAsync("localhost:6380");
        var cache = new RedisGeocodingCache(redis);

        var address = $"NonExistingAddress-{Guid.NewGuid()}";

        using var httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://nominatim.openstreetmap.org/")
        };

        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
            "BookYourSport-SearchService/1.0");

        var service = new GeocodingService(httpClient, cache);

        // Act
        var result = await service.GeocodeAsync(address);

        // Assert
        Assert.Null(result);
    }
}