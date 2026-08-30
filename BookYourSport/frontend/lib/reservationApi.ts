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

export type Club = {
    id: string;
    name: string;
    ownerId: string;
    description?: string;
    phoneNumber?: string;
    emailAddress?: string;
    address: Address;
    isActive: boolean;
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

const API_URL = process.env.NEXT_PUBLIC_RESERVATION_URL;

if (!API_URL) {
    throw new Error(
        "NEXT_PUBLIC_RESERVATION_URL nije podešen."
    );
}

export async function getClubs(): Promise<Club[]> {
    const response = await fetch(
        `${API_URL}/api/clubs`
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
        `${API_URL}/api/clubs/${clubId}`
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
        `${API_URL}/api/clubs/${clubId}/courts/${courtId}/availability?date=${date}`
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
    endTime: string,
    token: string
): Promise<Reservation> {
    const response = await fetch(
        `${API_URL}/api/clubs/${clubId}/courts/${courtId}/reservations`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
                startTime,
                endTime,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Rezervacija nije uspela."
        );
    }

    return data;
}