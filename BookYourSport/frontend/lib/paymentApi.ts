import { apiFetch } from "./api";

export type WalletBalance = {
    balance: number;
    currency: string;
};

export type WalletTransaction = {
    id: string;
    amount: number;
    type: "TopUp" | "ReservationCharge" | "Refund" | string;
    referenceId?: string | null;
    createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL nije podešen.");
}

async function readErrorMessage(response: Response, fallback: string) {
    try {
        const data = await response.json();
        return data?.detail || data?.message || data?.title || fallback;
    } catch {
        return fallback;
    }
}

export async function getBalance(): Promise<WalletBalance> {
    const response = await apiFetch(
        `${API_URL}/payment/api/wallet/balance`
    );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(
                response,
                "Nije moguće učitati stanje na računu."
            )
        );
    }

    return response.json();
}

export async function getTransactions(): Promise<WalletTransaction[]> {
    const response = await apiFetch(
        `${API_URL}/payment/api/wallet/transactions`
    );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(
                response,
                "Nije moguće učitati istoriju transakcija."
            )
        );
    }

    return response.json();
}

export async function topUp(
    amount: number,
    currency = "RSD"
): Promise<WalletBalance> {
    const response = await apiFetch(
        `${API_URL}/payment/api/TopUp`,
        {
            method: "POST",
            body: JSON.stringify({
                amount,
                currency,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Uplata nije uspela.")
        );
    }

    // TopUp endpoint vraća PaymentResult,
    // pa nakon uspešne uplate ponovo učitavamo balans.
    return getBalance();
}