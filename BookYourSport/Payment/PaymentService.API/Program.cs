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
using PaymentService.Application.Common;
using PaymentService.Domain.Services;
using PaymentService.Infrastructure.Auth;
using PaymentService.Infrastructure.Documents;
using PaymentService.Infrastructure.Messaging;
using PaymentService.Infrastructure.Payment;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Infrastructure.Persistence.Outbox;
using PaymentService.Infrastructure.Repositories;


var builder = WebApplication.CreateBuilder(args);


// ==========================================
// SUBSCRIPTION CONFIGURATION
// ==========================================

// builder.Services.Configure<SubscriptionSettings>(
//     builder.Configuration.GetSection("Subscription"));
var subscriptionSettings = new SubscriptionSettings
{
    Amount = builder.Configuration.GetValue<decimal>(
        "Subscription:Amount"),

    Currency = builder.Configuration[
        "Subscription:Currency"] ?? "RSD"
};

builder.Services.AddSingleton(subscriptionSettings);


// ==========================================
// JWT CONFIGURATION
// ==========================================

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


// ==========================================
// SERVICES
// ==========================================

builder.Services.AddHostedService<OutboxProcessor>();

builder.Services.AddAuthorization();


// ==========================================
// CORS
// ==========================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});


// ==========================================
// QUESTPDF
// ==========================================

QuestPDF.Settings.License =
    QuestPDF.Infrastructure.LicenseType.Community;


// ==========================================
// CONTROLLERS / OPENAPI
// ==========================================

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


// ==========================================
// PAYMENT / CREDIT SERVICES
// ==========================================

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


// ==========================================
// PAYMENT DATABASE
// ==========================================

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "PaymentDb")));


// ==========================================
// AUTH SERVICE
// ==========================================

builder.Services.AddHttpClient<
    IAuthServiceClient,
    AuthServiceClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration[
            "AuthService:BaseUrl"]!);
});


// ==========================================
// SUBSCRIPTION
// ==========================================

builder.Services.AddScoped<
    PaySubscriptionHandler>();


// ==========================================
// CONTRACT SERVICES
// ==========================================

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


// ==========================================
// MESSAGING / OUTBOX
// ==========================================

builder.Services.AddScoped<
    IEventPublisher,
    RabbitMqEventPublisher>();

builder.Services.AddScoped<
    IOutboxWriter,
    OutboxWriter>();


// ==========================================
// EXCEPTION HANDLING
// ==========================================

builder.Services.AddExceptionHandler<
    GlobalExceptionHandler>();

builder.Services.AddProblemDetails();


var app = builder.Build();


// ==========================================
// MIDDLEWARE
// ==========================================

app.UseExceptionHandler();


// ==========================================
// SWAGGER
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}


// ==========================================
// HTTP / CORS / AUTH
// ==========================================

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();