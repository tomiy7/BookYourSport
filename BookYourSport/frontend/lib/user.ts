export type StoredUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    city?: string | null;
    dateOfBirth?: string | null;
    role: string;
};


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


export function getDashboardPath(
    role?: string | null
) {

    const normalizedRole =
        role
            ?.trim()
            .toLowerCase();


    if (
        normalizedRole ===
        "admin"
    ) {
        return "/admin-dashboard";
    }


    if (
        normalizedRole ===
        "club"
    ) {
        return "/club-owner-dashboard";
    }


    return "/player-dashboard";
}
