import { jwtDecode } from "jwt-decode";

type JwtPayload = {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    role?: string;
};

type AuthResponse = {
    accessToken: string;
    refreshToken: string;
};

export function getAccessToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("refreshToken");
}

export function getUserRole(): string | null {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    try {
        const decoded = jwtDecode<JwtPayload>(token);

        return decoded.role ?? null;
    } catch {
        return null;
    }
}

export function isLoggedIn(): boolean {
    return !!getAccessToken();
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") {
        return null;
    }

    // Ako je refresh već u toku,
    // sačekamo isti refresh umesto da šaljemo
    // više /auth/refresh zahteva istovremeno.
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL nije podešen.");
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(
                `${apiUrl}/auth/refresh`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        refreshToken,
                    }),
                }
            );

            if (!response.ok) {
                return null;
            }

            const data: AuthResponse =
                await response.json();

            if (
                !data.accessToken ||
                !data.refreshToken
            ) {
                return null;
            }

            // Backend rotira refresh token.
            // Zato moramo sačuvati OBA nova tokena.
            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );

            window.dispatchEvent(
                new Event("auth-change")
            );

            return data.accessToken;
        } catch (error) {
            console.error(
                "Greška prilikom osvežavanja tokena:",
                error
            );

            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export function logout() {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.dispatchEvent(
        new Event("auth-change")
    );
}