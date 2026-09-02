import { apiFetch } from "@/lib/api";

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
    // UČITAJ NAJNOVIJE PODATKE USER-A
    //
    // Napomena: NE radimo ovde sopstveni
    // /auth/refresh poziv. apiFetch već sam
    // radi refresh (i to samo ako dobije 401,
    // preko istog deljenog refreshPromise-a
    // iz lib/auth.ts). Da smo ovde ručno zvali
    // /auth/refresh, dobili bismo DVA nezavisna
    // refresh mehanizma koja se utrkuju za isti
    // (rotirajući) refresh token - to je bilo
    // uzrok bug-a.
    // ==========================================

    const response =
        await apiFetch(
            `${apiUrl}/auth/me`,
            {
                method: "GET",
            }
        );


    if (!response.ok) {

        // apiFetch je već pokušao refresh interno.
        // Ako smo i dalje ovde sa ne-ok odgovorom,
        // sesija je zaista nevalidna - čistimo je.

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


    const user =
        await response.json();


    // ==========================================
    // UPDATE LOCAL STORAGE
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
    // NOTIFY HEADER
    // ==========================================

    window.dispatchEvent(
        new Event(
            "auth-change"
        )
    );


    return user as StoredUser;

}