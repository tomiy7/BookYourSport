import {
    getAccessToken,
    refreshAccessToken,
    logout,
} from "./auth";

export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = getAccessToken();

    const makeRequest = (
        token: string | null
    ) => {
        const headers = new Headers(
            options.headers
        );

        headers.set(
            "Content-Type",
            "application/json"
        );

        if (token) {
            headers.set(
                "Authorization",
                `Bearer ${token}`
            );
        }

        return fetch(url, {
            ...options,
            headers,
        });
    };

    let response =
        await makeRequest(accessToken);

    // Ako je access token istekao ili je
    // korisnik promenio rolu, pokušaj refresh.
    if (
        response.status === 401 ||
        response.status === 403
    ) {
        try {
            const refreshedToken =
                await refreshAccessToken();

            if (!refreshedToken) {
                if (response.status === 401) {
                    logout();
                }

                return response;
            }

            accessToken = refreshedToken;

            // Ponovi ORIGINALNI request
            // samo jednom sa novim tokenom.
            response =
                await makeRequest(
                    accessToken
                );
        } catch {
            if (response.status === 401) {
                logout();
            }
        }
    }

    return response;
}