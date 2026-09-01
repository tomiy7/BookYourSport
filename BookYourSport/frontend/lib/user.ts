import { getAccessToken } from "@/lib/auth";

export interface StoredUser {
    id: string;

    firstName: string;

    lastName: string;

    email: string;

    city?: string | null;

    dateOfBirth?: string | null;

    role: string;

    approvalStatus?: string;

    contractStatus?: string;

    subscriptionStatus?: string;
}


// ==========================================
// GET STORED USER
// ==========================================

export function getStoredUser():
    | StoredUser
    | null {

    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }


    const savedUser =
        localStorage.getItem(
            "user"
        );


    if (!savedUser) {
        return null;
    }


    try {

        return JSON.parse(
            savedUser
        ) as StoredUser;

    } catch {

        return null;

    }
}


// ==========================================
// DASHBOARD PATH
// ==========================================

export function getDashboardPath(
    role?: string | null
) {

    const normalizedRole =
        (
            role ||
            ""
        )
            .trim()
            .toLowerCase();


    switch (
        normalizedRole
        ) {

        case "admin":
            return "/admin-dashboard";


        case "club":
        case "clubowner":
        case "club owner":
            return "/club-owner-dashboard";


        case "player":
        default:
            return "/player-dashboard";

    }
}


// ==========================================
// REFRESH CURRENT USER
// ==========================================

export async function refreshCurrentUser():
    Promise<StoredUser> {

    if (
        typeof window ===
        "undefined"
    ) {
        throw new Error(
            "Ova funkcija mora da se izvršava u browseru."
        );
    }


    const apiUrl =
        process.env
            .NEXT_PUBLIC_API_URL;


    if (!apiUrl) {

        throw new Error(
            "NEXT_PUBLIC_API_URL nije podešen."
        );

    }


    // ==========================================
    // 1. UZMI REFRESH TOKEN
    // ==========================================

    const refreshToken =
        localStorage.getItem(
            "refreshToken"
        );


    if (!refreshToken) {

        throw new Error(
            "Niste prijavljeni."
        );

    }


    // ==========================================
    // 2. OSVEŽI TOKENE
    // ==========================================

    const refreshResponse =
        await fetch(
            `${apiUrl}/auth/refresh`,
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


    if (!refreshResponse.ok) {

        // Refresh token više nije validan.
        // Brišemo lokalnu sesiju.

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
            "Sesija je istekla. Potrebno je ponovo se prijaviti."
        );

    }


    const tokens =
        await refreshResponse.json();


    // ==========================================
    // 3. SAČUVAJ NOVE TOKENE
    // ==========================================

    localStorage.setItem(
        "accessToken",
        tokens.accessToken
    );


    localStorage.setItem(
        "refreshToken",
        tokens.refreshToken
    );


    // ==========================================
    // 4. UČITAJ NAJNOVIJE PODATKE USER-A
    // ==========================================

    const response =
        await fetch(
            `${apiUrl}/auth/me`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${tokens.accessToken}`,
                },
            }
        );


    if (!response.ok) {

        if (
            response.status ===
            401
        ) {

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

        }


        throw new Error(
            "Nije moguće učitati podatke korisnika."
        );

    }


    const user =
        await response.json();


    // ==========================================
    // 5. UPDATE LOCAL STORAGE
    // ==========================================

    localStorage.setItem(
        "user",
        JSON.stringify(
            user
        )
    );


    localStorage.setItem(
        "firstName",
        user.firstName ||
        ""
    );


    // ==========================================
    // 6. NOTIFY HEADER
    // ==========================================

    window.dispatchEvent(
        new Event(
            "auth-change"
        )
    );


    return user as StoredUser;

}