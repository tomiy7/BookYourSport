using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Commands.ChargeCredit;
using PaymentService.Application.Commands.RefundCredit;
using PaymentService.Application.Commands.TopUpCredit;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Services;
using PaymentService.Infrastructure.Payment;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();
builder.Services.AddScoped<ICreditAccountRepository, CreditAccountRepository>();
builder.Services.AddScoped<TopUpCreditHandler>();
builder.Services.AddScoped<ChargeCreditHandler>();
builder.Services.AddScoped<RefundCreditHandler>();
builder.Services.AddScoped<RefundPolicy>();
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PaymentDb")));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
