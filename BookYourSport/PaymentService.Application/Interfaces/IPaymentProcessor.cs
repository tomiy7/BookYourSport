using System;
using System.Collections.Generic;
using System.Text;

namespace PaymentService.Application.Interfaces;


public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessPaymentAsync(
        Guid userId,
        decimal amount,
        string currency);
}