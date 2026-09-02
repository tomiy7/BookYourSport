import { getAccessToken, refreshAccessToken, logout } from "./auth";

export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = getAccessToken();

    const makeRequest = (token: string | null) => {
        const headers = new Headers(options.headers);

        headers.set("Content-Type", "application/json");

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return fetch(url, {
            ...options,
            headers,
        });
    };

    let response = await makeRequest(accessToken);

    // Ako je access token istekao, pokušaj refresh
    if (response.status === 401) {
        try {
            accessToken = await refreshAccessToken();

            if (!accessToken) {
                logout();
                return response;
            }

            // Ponovi ORIGINALNI request sa novim tokenom
            response = await makeRequest(accessToken);
        } catch {
            logout();
        }
    }

    return response;
}