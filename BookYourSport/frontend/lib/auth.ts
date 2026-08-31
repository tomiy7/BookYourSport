import { jwtDecode } from "jwt-decode";

type JwtPayload = {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    role?: string;
};

export function getAccessToken() {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("accessToken");
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

export function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.dispatchEvent(new Event("auth-change"));
}