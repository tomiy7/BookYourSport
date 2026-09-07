using PaymentService.Application.Common;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Contract;

namespace PaymentService.Application.Commands.PaySubscription;

public class PaySubscriptionHandler
{
    private readonly IAuthServiceClient _authServiceClient;
    private readonly IContractRepository _contractRepository;
    private readonly ICreditAccountRepository _creditAccountRepository;
    private readonly SubscriptionSettings _subscriptionSettings;

    public PaySubscriptionHandler(
        IAuthServiceClient authServiceClient,
        IContractRepository contractRepository,
        ICreditAccountRepository creditAccountRepository,
        SubscriptionSettings subscriptionSettings)
    {
        _authServiceClient = authServiceClient;
        _contractRepository = contractRepository;
        _creditAccountRepository = creditAccountRepository;
        _subscriptionSettings = subscriptionSettings;
    }

    public async Task<PaymentResult> Handle(
        PaySubscriptionCommand command)
    {
        // =========================================================
        // SUBSCRIPTION PRICE
        // =========================================================
        // Cena je definisana ISKLJUČIVO na backendu.
        // Frontend ne može da odredi cenu pretplate.
        var amount = _subscriptionSettings.Amount;
        var currency = _subscriptionSettings.Currency;

        if (amount <= 0)
        {
            throw new InvalidOperationException(
                "Subscription amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(currency))
        {
            throw new InvalidOperationException(
                "Subscription currency is not configured.");
        }

        // =========================================================
        // SIGNED CONTRACT
        // =========================================================

        var contract =
            await _contractRepository.GetSignedByUserIdAsync(
                command.UserId);

        if (contract == null)
        {
            throw new InvalidOperationException(
                "A signed contract was not found.");
        }

        // =========================================================
        // USER
        // =========================================================

        var user =
            await _authServiceClient.GetUserAsync(
                command.UserId);

        if (user == null)
        {
            throw new InvalidOperationException(
                "User was not found.");
        }

        if (user.ApprovalStatus != AuthApprovalStatus.Approved)
        {
            throw new InvalidOperationException(
                "User must be approved by an admin before subscription payment.");
        }

        // =========================================================
        // WALLET
        // =========================================================

        var creditAccount =
            await _creditAccountRepository.GetByUserIdAsync(
                command.UserId);

        if (creditAccount == null)
        {
            throw new InvalidOperationException(
                "Credit account was not found.");
        }

        // =========================================================
        // BALANCE CHECK
        // =========================================================

        var availableBalance = creditAccount.Balance;

        if (availableBalance < amount)
        {
            throw new InvalidOperationException(
                $"Nedovoljno sredstava za plaćanje pretplate. " +
                $"Potrebno je {amount:N2} {currency}, " +
                $"a trenutno imaš {availableBalance:N2} {currency}.");
        }

        // =========================================================
        // CHARGE WALLET
        // =========================================================
        // Ovde se stvarno skida novac sa korisničkog računa.
        //
        // Koristimo ID ugovora kao reference jer je ovo
        // plaćanje pretplate, a ne rezervacije.

        var transaction = creditAccount.Charge(
            amount,
            contract.Id);

        await _creditAccountRepository.SaveAsync(
            creditAccount);

        // =========================================================
        // SUBSCRIPTION PAYMENT SUCCESS
        // =========================================================
        // PaymentId je ID stvarne wallet transakcije.

        await _authServiceClient.NotifySubscriptionPaidAsync(
            command.UserId,
            transaction.Id,
            contract.Id,
            amount,
            currency);

        return new PaymentResult
        {
            IsSuccessful = true,
            PaymentId = transaction.Id
        };
    }
}