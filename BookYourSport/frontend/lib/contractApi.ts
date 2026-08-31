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


const PAYMENT_API_URL =
    process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
    process.env.NEXT_PUBLIC_API_URL;


// ==========================================
// API URL
// ==========================================

function getPaymentApiUrl() {
    if (!PAYMENT_API_URL) {
        throw new Error(
            "Payment API URL nije podešen."
        );
    }

    return PAYMENT_API_URL;
}


// ==========================================
// AUTH HEADERS
// ==========================================

function getAuthHeaders() {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        throw new Error(
            "Nisi prijavljen."
        );
    }

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type":
            "application/json",
    };
}


// ==========================================
// ERROR MESSAGE
// ==========================================

async function getErrorMessage(
    response: Response,
    fallback: string
) {
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
// GET /contracts/user/{userId}
// ==========================================

export async function getContractByUser(
    userId: string
): Promise<Contract | null> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/user/${userId}`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(),
            }
        );


    if (
        response.status === 404
    ) {
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
// POST /contracts/generate
// ==========================================

export async function generateContract(
    userId: string
): Promise<Contract> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/generate`,
            {
                method: "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify({
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
// POST /contracts/{contractId}/sign
// ==========================================

export async function signContract(
    contractId: string
): Promise<Contract> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/contracts/${contractId}/sign`,
            {
                method: "POST",

                headers:
                    getAuthHeaders(),
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
// GET /contracts/{contractId}/document
// ==========================================

export function getContractDocumentUrl(
    contractId: string
) {
    return (
        `${getPaymentApiUrl()}` +
        `/contracts/${contractId}/document`
    );
}


// ==========================================
// PAY SUBSCRIPTION
// POST /api/Subscription/pay
// ==========================================

export async function paySubscription(
    userId: string,
    amount: number,
    currency: string
): Promise<PaymentResult> {

    const response =
        await fetch(
            `${getPaymentApiUrl()}/api/Subscription/pay`,
            {
                method: "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify({
                        userId,
                        amount,
                        currency,
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