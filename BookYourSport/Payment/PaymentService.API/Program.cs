using System.Security.Claims;
using Messaging.Interfaces;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using PaymentService.API.Exceptions;
using PaymentService.Application.Commands.ChargeCredit;
using PaymentService.Application.Commands.GenerateContract;
using PaymentService.Application.Commands.PaySubscription;
using PaymentService.Application.Commands.RefundCredit;
using PaymentService.Application.Commands.SignContract;
using PaymentService.Application.Commands.TopUpCredit;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Services;
using PaymentService.Infrastructure.Auth;
using PaymentService.Infrastructure.Documents;
using PaymentService.Infrastructure.Messaging;
using PaymentService.Infrastructure.Payment;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Infrastructure.Persistence.Outbox;
using PaymentService.Infrastructure.Repositories;


var builder = WebApplication.CreateBuilder(args);

var jwtSecret = builder.Configuration["Jwt:Secret"]
                ?? throw new InvalidOperationException(
                    "Jwt:Secret is not configured.");

jwtSecret = jwtSecret.Trim();

var jwtKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwtSecret)
)
{
    KeyId = "bookyoursport"
};

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,

                IssuerSigningKey = jwtKey,

                ValidateIssuer = false,
                ValidateAudience = false,

                ValidateLifetime = true,

                NameClaimType = ClaimTypes.NameIdentifier,

                RoleClaimType = ClaimTypes.Role
            };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine(
                    $"JWT AUTH FAILED: {context.Exception.Message}");

                return Task.CompletedTask;
            },

            OnTokenValidated = context =>
            {
                var userId = context.Principal?
                    .FindFirst(ClaimTypes.NameIdentifier)?
                    .Value;

                Console.WriteLine(
                    $"JWT VALIDATED: {userId}");

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddHostedService<OutboxProcessor>();

builder.Services.AddAuthorization();

// CORS - allow frontend to communicate with Payment API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

QuestPDF.Settings.License =
    QuestPDF.Infrastructure.LicenseType.Community;

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description =
                "JWT Authorization header using the Bearer scheme."
        });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference(
                "Bearer",
                document)] = []
        });
});

// Register payment and credit account services.
builder.Services.AddScoped<
    IPaymentProcessor,
    MockPaymentProcessor>();

builder.Services.AddScoped<
    ICreditAccountRepository,
    CreditAccountRepository>();

builder.Services.AddScoped<
    TopUpCreditHandler>();

builder.Services.AddScoped<
    ChargeCreditHandler>();

builder.Services.AddScoped<
    RefundCreditHandler>();

builder.Services.AddScoped<
    RefundPolicy>();

// Configure the Payment Service database.
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "PaymentDb")));

// Configure communication with Auth Service.
builder.Services.AddHttpClient<
    IAuthServiceClient,
    AuthServiceClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration[
            "AuthService:BaseUrl"]!);
});

builder.Services.AddScoped<
    PaySubscriptionHandler>();

// Register contract generation and persistence services.
builder.Services.AddScoped<
    IPdfContractGenerator,
    PdfContractGenerator>();

builder.Services.AddScoped<
    IContractRepository,
    ContractRepository>();

builder.Services.AddScoped<
    GenerateContractHandler>();

builder.Services.AddScoped<
    SignContractHandler>();

builder.Services.AddScoped<
    IEventPublisher,
    RabbitMqEventPublisher>();

builder.Services.AddScoped<
    IOutboxWriter,
    OutboxWriter>();

builder.Services.AddExceptionHandler<
    GlobalExceptionHandler>();

builder.Services.AddProblemDetails();


var app = builder.Build();

app.UseExceptionHandler();

// Configure API documentation and Swagger for development.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();