import { apiFetch } from "./api";

export type Address = {
    city: string;
    municipality?: string;
    zipCode?: string;
    street: string;
    country: string;
    streetNumber: string;
};

export type Price = {
    amount: number;
    currency: string;
};

export type Court = {
    id: string;
    clubId: string;
    name: string;
    surfaceType: number | string;
    isIndoor: boolean;
    pricePerHour: Price;
    isActive: boolean;
};

export type WorkingHours = {
    id: string;
    dayOfWeek: number | string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
};

export type Club = {
    id: string;
    name: string;
    ownerId: string;
    description?: string;
    phoneNumber?: string;
    emailAddress?: string;
    address: Address;
    isActive: boolean;
    workingHours: WorkingHours[];
    courts: Court[];
};

export type AvailableSlot = {
    startTime: string;
    endTime: string;
};

export type Reservation = {
    id: string;
    courtId: string;
    clubId: string;
    userId: string;
    startTime: string;
    endTime: string;
    price: Price;
    status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error(
        "NEXT_PUBLIC_API_URL nije podešen."
    );
}

async function readJsonOrThrow(
    response: Response,
    fallbackMessage: string
) {
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message || fallbackMessage
        );
    }

    return data;
}

// ==========================================
// PUBLIC / PLAYER - PRETRAGA I REZERVACIJE
// ==========================================

export async function getClubs(): Promise<Club[]> {
    const response = await fetch(
        `${API_URL}/reservation/api/clubs`
    );

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati klubove."
        );
    }

    return response.json();
}

export async function getClub(
    clubId: string
): Promise<Club> {
    const response = await fetch(
        `${API_URL}/reservation/api/clubs/${clubId}`
    );

    if (!response.ok) {
        throw new Error(
            "Klub nije pronađen."
        );
    }

    return response.json();
}

export async function getAvailableSlots(
    clubId: string,
    courtId: string,
    date: string
): Promise<AvailableSlot[]> {
    const response = await fetch(
        `${API_URL}/reservation/api/clubs/${clubId}/courts/${courtId}/availability?date=${date}`
    );

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati slobodne termine."
        );
    }

    return response.json();
}

export async function createReservation(
    clubId: string,
    courtId: string,
    startTime: string,
    endTime: string
): Promise<Reservation> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs/${clubId}/courts/${courtId}/reservations`,
        {
            method: "POST",
            body: JSON.stringify({
                startTime,
                endTime,
            }),
        }
    );

    return readJsonOrThrow(
        response,
        "Rezervacija nije uspela."
    );
}

export async function getMyReservations(
    userId: string
): Promise<Reservation[]> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/reservations/user/${userId}`,
        {
            method: "GET",
        }
    );

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati tvoje rezervacije."
        );
    }

    return response.json();
}

export async function cancelReservation(
    reservationId: string
): Promise<void> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/reservations/${reservationId}/cancel`,
        {
            method: "PUT",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
            data?.message || "Otkazivanje rezervacije nije uspelo."
        );
    }
}

// ==========================================
// CLUB OWNER - UPRAVLJANJE KLUBOM
// ==========================================

export type CreateWorkingHoursPayload = {
    dayOfWeek: number; // 0=Sunday ... 6=Saturday (System.DayOfWeek na backendu)
    openTime: string;  // "HH:mm:ss"
    closeTime: string; // "HH:mm:ss"
    isClosed: boolean;
};

export type CreateClubPayload = {
    name: string;
    description?: string;
    phoneNumber?: string;
    emailAddress?: string;
    city: string;
    municipality?: string;
    zipCode?: string;
    street: string;
    country: string;
    streetNumber: string;
    workingHours?: CreateWorkingHoursPayload[];
};

export async function createClub(
    payload: CreateClubPayload
): Promise<Club> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );

    return readJsonOrThrow(
        response,
        "Kreiranje kluba nije uspelo."
    );
}

export type UpdateClubPayload = {
    name: string;
    description?: string;
    phoneNumber?: string;
    emailAddress?: string;
    city: string;
    municipality?: string;
    zipCode?: string;
    street: string;
    country: string;
    streetNumber: string;
    isActive: boolean;
    workingHours?: CreateWorkingHoursPayload[];
};

export async function updateClub(
    clubId: string,
    payload: UpdateClubPayload
): Promise<Club> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs/${clubId}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );

    return readJsonOrThrow(
        response,
        "Izmena kluba nije uspela."
    );
}

// ==========================================
// CLUB OWNER - UPRAVLJANJE TERENIMA
// ==========================================

export type CourtPayload = {
    name: string;
    surfaceType: number;
    isIndoor: boolean;
    pricePerHour: number;
    currency: string;
};

export async function createCourt(
    clubId: string,
    payload: CourtPayload
): Promise<Court> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs/${clubId}/courts`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );

    return readJsonOrThrow(
        response,
        "Dodavanje terena nije uspelo."
    );
}

export async function updateCourt(
    clubId: string,
    courtId: string,
    payload: CourtPayload & { isActive: boolean }
): Promise<Court> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs/${clubId}/courts/${courtId}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );

    return readJsonOrThrow(
        response,
        "Izmena terena nije uspela."
    );
}

export async function deleteCourt(
    clubId: string,
    courtId: string
): Promise<void> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/clubs/${clubId}/courts/${courtId}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
            data?.message || "Brisanje terena nije uspelo."
        );
    }
}

// ==========================================
// CLUB OWNER - PREGLED REZERVACIJA NA KLUBU
// ==========================================

export async function getClubReservations(
    clubId: string
): Promise<Reservation[]> {
    const response = await apiFetch(
        `${API_URL}/reservation/api/reservations/club/${clubId}`,
        {
            method: "GET",
        }
    );

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati rezervacije kluba."
        );
    }

    return response.json();
}