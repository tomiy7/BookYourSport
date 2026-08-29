using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
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
using PaymentService.Infrastructure.Payment;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License =
    QuestPDF.Infrastructure.LicenseType.Community;

builder.Services.AddControllers();

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

// Register payment and credit account services.
builder.Services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();
builder.Services.AddScoped<ICreditAccountRepository, CreditAccountRepository>();

builder.Services.AddScoped<TopUpCreditHandler>();
builder.Services.AddScoped<ChargeCreditHandler>();
builder.Services.AddScoped<RefundCreditHandler>();
builder.Services.AddScoped<RefundPolicy>();

// Configure the Payment Service database.
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PaymentDb")));

// Configure communication with Auth Service.
builder.Services.AddHttpClient<IAuthServiceClient, AuthServiceClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AuthService:BaseUrl"]!);
});

builder.Services.AddScoped<PaySubscriptionHandler>();

// Register contract generation and persistence services.
builder.Services.AddScoped<
    IPdfContractGenerator,
    PdfContractGenerator>();

builder.Services.AddScoped<
    IContractRepository,
    ContractRepository>();

builder.Services.AddScoped<GenerateContractHandler>();
builder.Services.AddScoped<SignContractHandler>();

var jwtSecret = builder.Configuration["Jwt:Secret"]
                ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure API documentation and Swagger for development.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();