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

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "Niste prijavljeni."
        );

    }


    const response =
        await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`,
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