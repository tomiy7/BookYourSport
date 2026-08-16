using PaymentService.Application.Interfaces;
using PaymentService.Infrastructure.Payment;
using PaymentService.Application.Commands.TopUpCredit;
using PaymentService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Application.Commands.ChargeCredit;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();
builder.Services.AddScoped<ICreditAccountRepository, CreditAccountRepository>();
builder.Services.AddScoped<TopUpCreditHandler>();
builder.Services.AddScoped<ChargeCreditHandler>();
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
