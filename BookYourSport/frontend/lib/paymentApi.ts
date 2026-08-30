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

function authHeaders(token: string) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function readErrorMessage(response: Response, fallback: string) {
    try {
        const data = await response.json();
        return data?.detail || data?.message || data?.title || fallback;
    } catch {
        return fallback;
    }
}

export async function getBalance(token: string): Promise<WalletBalance> {
    const response = await fetch(`${API_URL}/payment/api/wallet/balance`, {
        headers: authHeaders(token),
    });

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Nije moguće učitati stanje na računu.")
        );
    }

    return response.json();
}

export async function getTransactions(
    token: string
): Promise<WalletTransaction[]> {
    const response = await fetch(`${API_URL}/payment/api/wallet/transactions`, {
        headers: authHeaders(token),
    });

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(response, "Nije moguće učitati istoriju transakcija.")
        );
    }

    return response.json();
}

export async function topUp(
    amount: number,
    token: string,
    currency = "RSD"
): Promise<WalletBalance> {
    const response = await fetch(`${API_URL}/payment/api/TopUp`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Uplata nije uspela."));
    }

    // TopUp endpoint vraća PaymentResult (isSuccessful/paymentId),
    // ne novi balans — zato ga posebno učitavamo nakon uspešne uplate.
    return getBalance(token);
}