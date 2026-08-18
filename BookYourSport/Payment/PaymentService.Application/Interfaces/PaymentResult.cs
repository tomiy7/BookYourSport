using System;
using System.Collections.Generic;
using System.Text;

namespace PaymentService.Application.Interfaces;

public class PaymentResult
{
    public bool IsSuccessful { get; init; }
    public Guid PaymentId { get; init; }
}
