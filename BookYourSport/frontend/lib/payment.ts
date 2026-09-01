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


const API_URL =
    process.env.NEXT_PUBLIC_API_URL;


if (!API_URL) {
    throw new Error(
        "NEXT_PUBLIC_API_URL nije podešen."
    );
}


// ==========================================
// REFRESH STATE
// ==========================================
//
// Ako više requestova istovremeno dobije 401,
// samo jedan refresh se izvršava.
// Ostali čekaju isti Promise.
//

let refreshPromise:
    Promise<string> | null = null;


// ==========================================
// AUTH HEADERS
// ==========================================

function authHeaders(
    token: string
) {
    return {
        "Content-Type":
            "application/json",

        Authorization:
            `Bearer ${token}`,
    };
}


// ==========================================
// ERROR MESSAGE
// ==========================================

async function readErrorMessage(
    response: Response,
    fallback: string
) {
    try {

        const data =
            await response.json();

        return (
            data?.detail ||
            data?.message ||
            data?.title ||
            fallback
        );

    } catch {

        return fallback;

    }
}


// ==========================================
// REFRESH ACCESS TOKEN
// ==========================================

async function refreshAccessToken():
    Promise<string> {

    if (refreshPromise) {
        return refreshPromise;
    }


    refreshPromise =
        (async () => {

            const refreshToken =
                localStorage.getItem(
                    "refreshToken"
                );


            if (!refreshToken) {

                throw new Error(
                    "Sesija je istekla. Prijavite se ponovo."
                );

            }


            const response =
                await fetch(
                    `${API_URL}/auth/refresh`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                refreshToken,
                            }),
                    }
                );


            if (!response.ok) {

                localStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "refreshToken"
                );

                localStorage.removeItem(
                    "user"
                );

                localStorage.removeItem(
                    "firstName"
                );


                throw new Error(
                    "Sesija je istekla. Prijavite se ponovo."
                );

            }


            const data =
                await response.json();


            if (
                !data.accessToken ||
                !data.refreshToken
            ) {

                throw new Error(
                    "Server nije vratio nove tokene."
                );

            }


            // ==========================================
            // SAVE NEW TOKENS
            // ==========================================

            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );


            // ==========================================
            // NOTIFY APPLICATION
            // ==========================================

            window.dispatchEvent(
                new Event(
                    "auth-change"
                )
            );


            return data.accessToken;

        })();


    try {

        return await refreshPromise;

    } finally {

        refreshPromise = null;

    }
}


// ==========================================
// GET VALID ACCESS TOKEN
// ==========================================

async function getValidAccessToken():
    Promise<string> {

    const token =
        localStorage.getItem(
            "accessToken"
        );


    if (!token) {

        throw new Error(
            "Nisi prijavljen."
        );

    }


    return token;
}


// ==========================================
// AUTHENTICATED FETCH
// ==========================================
//
// Prvi request ide sa trenutnim access tokenom.
//
// Ako backend vrati 401:
// 1. refreshujemo token
// 2. čuvamo nove tokene
// 3. ponavljamo request samo jednom
//
// ==========================================

async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {

    const token =
        await getValidAccessToken();


    const firstResponse =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...authHeaders(token),
                    ...(options.headers || {}),
                },
            }
        );


    // ==========================================
    // TOKEN JE VALIDAN
    // ==========================================

    if (
        firstResponse.status !== 401
    ) {

        return firstResponse;

    }


    // ==========================================
    // ACCESS TOKEN NIJE VALIDAN
    // ==========================================

    const newToken =
        await refreshAccessToken();


    // ==========================================
    // RETRY REQUEST
    // ==========================================

    return fetch(
        url,
        {
            ...options,

            headers: {
                ...authHeaders(
                    newToken
                ),

                ...(options.headers || {}),
            },
        }
    );
}


// ==========================================
// GET BALANCE
// ==========================================

export async function getBalance(
    token?: string
): Promise<WalletBalance> {

    const accessToken =
        token ||
        await getValidAccessToken();


    const response =
        await authenticatedFetch(
            `${API_URL}/payment/api/wallet/balance`,
            {
                method: "GET",

                headers:
                    authHeaders(
                        accessToken
                    ),
            }
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


// ==========================================
// GET TRANSACTIONS
// ==========================================

export async function getTransactions(
    token?: string
): Promise<WalletTransaction[]> {

    const accessToken =
        token ||
        await getValidAccessToken();


    const response =
        await authenticatedFetch(
            `${API_URL}/payment/api/wallet/transactions`,
            {
                method: "GET",

                headers:
                    authHeaders(
                        accessToken
                    ),
            }
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


// ==========================================
// TOP UP
// ==========================================

export async function topUp(
    amount: number,
    token: string,
    currency = "RSD"
): Promise<WalletBalance> {

    const response =
        await authenticatedFetch(
            `${API_URL}/payment/api/TopUp`,
            {
                method: "POST",

                headers:
                    authHeaders(
                        token
                    ),

                body:
                    JSON.stringify({
                        amount,
                        currency,
                    }),
            }
        );


    if (!response.ok) {

        throw new Error(
            await readErrorMessage(
                response,
                "Uplata nije uspela."
            )
        );

    }


    // TopUp vraća PaymentResult,
    // pa nakon uspešne uplate ponovo
    // učitavamo stanje računa.

    return getBalance();
}