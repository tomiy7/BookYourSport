using SearchService.Application.Interfaces;
using SearchService.Application.Services;
using SearchService.Infrastructure.Caching;
using SearchService.Infrastructure.Clients;
using SearchService.Infrastructure.Geocoding;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();

builder.Services.AddHttpClient<IReservationServiceClient, ReservationServiceClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["Services:ReservationServiceUrl"]!);
});

builder.Services.AddScoped<IClubSearchService, ClubSearchService>();
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(
        builder.Configuration["Redis:ConnectionString"]!));

builder.Services.AddSingleton<RedisGeocodingCache>();

builder.Services.AddHttpClient<IGeocodingService, GeocodingService>(client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        "BookYourSport-SearchService/1.0");
});
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();