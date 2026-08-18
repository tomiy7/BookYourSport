using System;
using System.Collections.Generic;
using System.Text;

namespace PaymentService.Domain.Enums;

public enum TransactionType
{
    TopUp,
    ReservationCharge,
    Refund
}
