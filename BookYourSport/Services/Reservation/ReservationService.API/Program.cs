using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ReservationService.API.Grpc;
using ReservationService.Application.Interfaces;
using ReservationService.Application.Services;
using ReservationService.Domain.Interfaces;
using ReservationService.Infrastructure.Data;
using ReservationService.Infrastructure.Messaging;
using ReservationService.Infrastructure.Payment;
using ReservationService.Infrastructure.Repositories;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


// ==================================================
// DATABASE
// ==================================================

builder.Services.AddDbContext<ReservationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default")
    )
);


// ==================================================
// JWT AUTHENTICATION
// ==================================================

var jwtSecret =
    builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException(
        "Jwt:Secret is not configured."
    );


builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtSecret
                        )
                    ),

                ValidateIssuer = false,
                ValidateAudience = false
            };
    });


builder.Services.AddAuthorization();


// ==================================================
// REPOSITORIES
// ==================================================

builder.Services.AddScoped<
    IClubRepository,
    ClubRepository
>();


builder.Services.AddScoped<
    IReservationRepository,
    ReservationRepository
>();


// ==================================================
// APPLICATION SERVICES
// ==================================================

builder.Services.AddScoped<
    IClubService,
    ClubService
>();


builder.Services.AddScoped<
    ICourtService,
    CourtService
>();


builder.Services.AddScoped<
    IAvailabilityService,
    AvailabilityService
>();


builder.Services.AddScoped<
    IReservationService,
    ReservationBookingService
>();


builder.Services.AddHttpContextAccessor();


// ==================================================
// PAYMENT SERVICE HTTP CLIENT
// ==================================================

builder.Services.AddHttpClient<
    IPaymentServiceClient,
    PaymentServiceClient
>(client =>
{
    client.BaseAddress =
        new Uri(
            builder.Configuration[
                "PaymentService:BaseUrl"
            ]!
        );
});


// ==================================================
// CONTROLLERS + GRPC
// ==================================================

builder.Services.AddControllers();

builder.Services.AddGrpc();


// ==================================================
// SWAGGER
// ==================================================

builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Type =
                SecuritySchemeType.Http,

            Scheme =
                "bearer",

            BearerFormat =
                "JWT",

            Description =
                "JWT Authorization header using the Bearer scheme."
        }
    );


    options.AddSecurityRequirement(
        document =>
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document
                    )
                ] = []
            }
    );
});


// ==================================================
// CORS
// ==================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000"
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    );
});


// ==================================================
// RABBITMQ EVENT CONSUMER
// ==================================================

builder.Services.AddHostedService<
    RabbitMqEventConsumer
>();


var app = builder.Build();


// ==================================================
// SWAGGER
// ==================================================

if (
    app.Environment.IsDevelopment()
)
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ==================================================
// HTTP PIPELINE
// ==================================================

// CORS mora biti pre Authentication/Authorization
app.UseCors(
    "AllowFrontend"
);


app.UseAuthentication();


app.UseAuthorization();


// ==================================================
// API CONTROLLERS
// ==================================================

app.MapControllers();


// ==================================================
// GRPC
// ==================================================

app.MapGrpcService<
    ReservationGrpcService
>();


// ==================================================
// DATABASE MIGRATIONS + SEED
// ==================================================

using (
    var scope =
        app.Services.CreateScope()
)
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<
                ReservationDbContext
            >();


    await db.Database.MigrateAsync();


    await DbInitializer.SeedAsync(
        db
    );
}


// ==================================================
// RUN APPLICATION
// ==================================================

app.Run();