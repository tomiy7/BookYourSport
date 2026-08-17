using Microsoft.EntityFrameworkCore;
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
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();
builder.Services.AddScoped<ICreditAccountRepository, CreditAccountRepository>();
builder.Services.AddScoped<TopUpCreditHandler>();
builder.Services.AddScoped<ChargeCreditHandler>();
builder.Services.AddScoped<RefundCreditHandler>();
builder.Services.AddScoped<RefundPolicy>();
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PaymentDb")));
builder.Services.AddHttpClient<IAuthServiceClient, AuthServiceClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["AuthService:BaseUrl"]!);
});
builder.Services.AddScoped<PaySubscriptionHandler>();
builder.Services.AddScoped<
    IPdfContractGenerator,
    PdfContractGenerator>();

builder.Services.AddScoped<
    IContractRepository,
    ContractRepository>();
builder.Services.AddScoped<GenerateContractHandler>();
builder.Services.AddScoped<SignContractHandler>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
