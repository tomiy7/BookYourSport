export interface Contract {
    contractId: string;
    userId: string;
    documentPath: string;
    status: string;
    createdAt: string;
    signedAt?: string | null;
}

export interface PaymentResult {
    isSuccessful: boolean;
    paymentId: string;
}


// ==========================================
// API URL
// ==========================================

const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

function getPaymentApiUrl(): string {
    if (!API_URL) {
        throw new Error(
            "NEXT_PUBLIC_API_URL nije podešen."
        );
    }

    // PaymentService je iza API Gateway-a
    return `${API_URL}/payment`;
}


// ==========================================
// AUTH HEADERS
// ==========================================

function getAuthHeaders() {
    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        throw new Error(
            "Nisi prijavljen."
        );
    }

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}


// ==========================================
// ERROR MESSAGE
// ==========================================

async function getErrorMessage(
    response: Response,
    fallback: string
): Promise<string> {
    try {
        const data =
            await response.json();

        return (
            data.message ||
            data.detail ||
            data.title ||
            fallback
        );
    } catch {
        return fallback;
    }
}


// ==========================================
// GET CONTRACT BY USER
// GET /payment/contracts/user/{userId}
// ==========================================

export async function getContractByUser(
    userId: string
): Promise<Contract | null> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/user/${userId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Nije moguće učitati ugovor."
            )
        );
    }

    return response.json();
}


// ==========================================
// GENERATE CONTRACT
// POST /payment/contracts/generate
// ==========================================

export async function generateContract(
    userId: string
): Promise<Contract> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/generate`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    userId,
                }),
            }
        );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Generisanje ugovora nije uspelo."
            )
        );
    }

    return response.json();
}


// ==========================================
// SIGN CONTRACT
// POST /payment/contracts/{contractId}/sign
// ==========================================

export async function signContract(
    contractId: string
): Promise<Contract> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/${contractId}/sign`,
            {
                method: "POST",
                headers: getAuthHeaders(),
            }
        );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Potpisivanje ugovora nije uspelo."
            )
        );
    }

    return response.json();
}


// ==========================================
// CONTRACT DOCUMENT URL
// GET /payment/contracts/{contractId}/document
// ==========================================

export function getContractDocumentUrl(
    contractId: string
): string {
    return (
        `${getPaymentApiUrl()}` +
        `/contracts/${contractId}/document`
    );
}


// ==========================================
// PAY SUBSCRIPTION
// POST /payment/api/Subscription/pay
// ==========================================

export async function paySubscription(
    userId: string
): Promise<PaymentResult> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/api/Subscription/pay`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    userId,
                }),
            }
        );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Plaćanje pretplate nije uspelo."
            )
        );
    }

    return response.json();
}