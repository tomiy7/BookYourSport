"use client";

import { useEffect, useState } from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";

import Header from "../../Header";
import Footer from "../../Footer";

type ClubAddress = {
    city?: string;
    municipality?: string;
    zipCode?: string;
    street?: string;
    country?: string;
    streetNumber?: string;
};

type Club = {
    id: string;
    name: string;
    description?: string;
    address?: ClubAddress | string;
    Address?: ClubAddress;
};

type Court = {
    id: string;
    name: string;
    surfaceType?: string | number;
    isIndoor?: boolean;
};

type AvailableSlot = {
    startTime: string;
    endTime: string;
};

type DaySelection = {
    date: string;
    slots: AvailableSlot[];
};

function formatClubAddress(club: Club) {
    const address =
        club.address || club.Address;

    if (!address) {
        return "";
    }

    if (typeof address === "string") {
        return address;
    }

    const streetPart = [
        address.street,
        address.streetNumber,
    ]
        .filter(Boolean)
        .join(" ");

    const cityPart = [
        address.zipCode,
        address.city || address.municipality,
    ]
        .filter(Boolean)
        .join(" ");

    return [
        streetPart,
        cityPart,
        address.country,
    ]
        .filter(Boolean)
        .join(", ");
}

function formatSurfaceType(
    surfaceType?: string | number
) {
    if (
        surfaceType === undefined ||
        surfaceType === null ||
        surfaceType === ""
    ) {
        return "";
    }

    if (typeof surfaceType === "number") {
        const map: Record<number, string> = {
            0: "Šljaka",
            1: "Beton",
        };

        return map[surfaceType] || "";
    }

    const normalized = surfaceType
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, "");

    const map: Record<string, string> = {
        clay: "Šljaka",
        sljaka: "Šljaka",
        "šljaka": "Šljaka",

        hard: "Beton",
        hardcourt: "Beton",
        concrete: "Beton",
        beton: "Beton",
    };

    return map[normalized] || surfaceType;
}

function formatCourtName(court?: Court) {
    if (!court) {
        return "";
    }

    const surface =
        formatSurfaceType(
            court.surfaceType
        );

    const location =
        court.isIndoor
            ? "zatvoreni"
            : "otvoreni";

    if (surface) {
        return `${court.name} – ${surface} (${location})`;
    }

    return `${court.name} (${location})`;
}

function formatDate(dateString: string) {
    const date = new Date(
        `${dateString}T12:00:00`
    );

    return new Intl.DateTimeFormat(
        "sr-Latn-RS",
        {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(date);
}

function formatTime(dateTime: string) {
    return new Intl.DateTimeFormat(
        "sr-RS",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Europe/Belgrade",
        }
    ).format(
        new Date(dateTime)
    );
}

function sortSlots(
    slots: AvailableSlot[]
) {
    return [...slots].sort(
        (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime()
    );
}

function areSlotsConsecutive(
    slots: AvailableSlot[]
) {
    if (slots.length <= 1) {
        return true;
    }

    const sorted = sortSlots(slots);

    for (
        let i = 0;
        i < sorted.length - 1;
        i++
    ) {
        if (
            sorted[i].endTime !==
            sorted[i + 1].startTime
        ) {
            return false;
        }
    }

    return true;
}

export default function ClubDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const clubId =
        params.clubId as string;

    const [club, setClub] =
        useState<Club | null>(null);

    const [courts, setCourts] =
        useState<Court[]>([]);

    const [
        selectedCourtId,
        setSelectedCourtId,
    ] = useState("");

    const [
        selectedDate,
        setSelectedDate,
    ] = useState("");

    const [
        availableSlots,
        setAvailableSlots,
    ] = useState<AvailableSlot[]>([]);

    const [
        selectedSlots,
        setSelectedSlots,
    ] = useState<AvailableSlot[]>([]);

    const [
        selectedDays,
        setSelectedDays,
    ] = useState<DaySelection[]>([]);

    const [
        loadingClub,
        setLoadingClub,
    ] = useState(true);

    const [
        loadingSlots,
        setLoadingSlots,
    ] = useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadClub() {
            try {
                setLoadingClub(true);

                const response =
                    await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${clubId}/courts`
                    );

                if (!response.ok) {
                    throw new Error();
                }

                const data =
                    await response.json();

                setClub(data);
            } catch {
                setError(
                    "Došlo je do greške prilikom učitavanja kluba."
                );
            } finally {
                setLoadingClub(false);
            }
        }

        loadClub();
    }, [clubId]);

    useEffect(() => {
        async function loadCourts() {
            try {
                const response =
                    await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${clubId}/courts`
                    );

                if (!response.ok) {
                    throw new Error();
                }

                const data =
                    await response.json();

                setCourts(data);

                if (data.length > 0) {
                    setSelectedCourtId(
                        data[0].id
                    );
                }
            } catch {
                setError(
                    "Došlo je do greške prilikom učitavanja terena."
                );
            }
        }

        loadCourts();
    }, [clubId]);

    async function loadAvailableSlots() {
        if (
            !selectedCourtId ||
            !selectedDate
        ) {
            return;
        }

        try {
            setLoadingSlots(true);
            setError("");
            setAvailableSlots([]);
            setSelectedSlots([]);

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${clubId}/courts/${selectedCourtId}/availability?date=${selectedDate}`
                );
            
            if (!response.ok) {
                throw new Error();
            }

            const data =
                await response.json();

            setAvailableSlots(
                sortSlots(data)
            );
        } catch {
            setError(
                "Nije moguće učitati slobodne termine."
            );
        } finally {
            setLoadingSlots(false);
        }
    }

    function toggleSlot(
        slot: AvailableSlot
    ) {
        setError("");

        const exists =
            selectedSlots.some(
                (item) =>
                    item.startTime ===
                    slot.startTime
            );

        if (exists) {
            setSelectedSlots(
                (current) =>
                    current.filter(
                        (item) =>
                            item.startTime !==
                            slot.startTime
                    )
            );

            return;
        }

        if (
            selectedSlots.length >= 4
        ) {
            setError(
                "Jedna rezervacija može trajati najviše 4 sata."
            );

            return;
        }

        const newSelection =
            sortSlots([
                ...selectedSlots,
                slot,
            ]);

        if (
            !areSlotsConsecutive(
                newSelection
            )
        ) {
            setError(
                "Za jedan datum možeš izabrati samo uzastopne termine."
            );

            return;
        }

        setSelectedSlots(
            newSelection
        );
    }

    function addSelectedDay() {
        if (
            !selectedDate ||
            selectedSlots.length === 0
        ) {
            return;
        }

        setSelectedDays(
            (currentDays) => {
                const withoutCurrentDate =
                    currentDays.filter(
                        (day) =>
                            day.date !==
                            selectedDate
                    );

                return [
                    ...withoutCurrentDate,
                    {
                        date:
                        selectedDate,

                        slots:
                            sortSlots(
                                selectedSlots
                            ),
                    },
                ].sort(
                    (a, b) =>
                        a.date.localeCompare(
                            b.date
                        )
                );
            }
        );

        setSelectedSlots([]);
        setAvailableSlots([]);
        setSelectedDate("");
    }

    function removeDay(
        date: string
    ) {
        setSelectedDays(
            (current) =>
                current.filter(
                    (day) =>
                        day.date !== date
                )
        );
    }

    function continueToPayment() {
        if (
            selectedDays.length === 0
        ) {
            setError(
                "Dodaj bar jedan termin za rezervaciju."
            );

            return;
        }

        const selectedCourt =
            courts.find(
                (court) =>
                    court.id ===
                    selectedCourtId
            );

        const reservations =
            selectedDays.map(
                (day) => {
                    const slots =
                        sortSlots(
                            day.slots
                        );

                    return {
                        date:
                        day.date,

                        startTime:
                        slots[0]
                            .startTime,

                        endTime:
                        slots[
                        slots.length -
                        1
                            ].endTime,
                    };
                }
            );

        const queryParams =
            new URLSearchParams({
                clubId,
                clubName:
                    club?.name || "",

                courtId:
                selectedCourtId,

                courtName:
                    formatCourtName(
                        selectedCourt
                    ),

                reservations:
                    JSON.stringify(
                        reservations
                    ),
            });

        router.push(
            `/payment?${queryParams.toString()}`
        );
    }

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const selectedCourt =
        courts.find(
            (court) =>
                court.id ===
                selectedCourtId
        );

    if (loadingClub) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <Header />

                <div className="py-24 text-center text-zinc-500">
                    Učitavanje kluba...
                </div>

                <Footer />
            </main>
        );
    }

    if (!club) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <Header />

                <div className="py-24 text-center text-zinc-500">
                    Klub nije pronađen.
                </div>

                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            <Header />

            <div className="mx-auto max-w-6xl px-6 py-12">
                <section className="rounded-3xl bg-white p-8 shadow-sm">
                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                        Teniski klub
                    </span>

                    <h1 className="mt-3 text-4xl font-bold text-zinc-900">
                        {club.name}
                    </h1>

                    {formatClubAddress(
                        club
                    ) && (
                        <p className="mt-4 text-zinc-600">
                            📍{" "}
                            {formatClubAddress(
                                club
                            )}
                        </p>
                    )}

                    {club.description && (
                        <p className="mt-4 max-w-3xl leading-7 text-zinc-600">
                            {club.description}
                        </p>
                    )}
                </section>

                <section className="mt-10">
                    <h2 className="text-2xl font-bold text-zinc-900">
                        1. Izaberi teren
                    </h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {courts.map(
                            (court) => (
                                <button
                                    key={
                                        court.id
                                    }
                                    type="button"
                                    onClick={() => {
                                        setSelectedCourtId(
                                            court.id
                                        );

                                        setSelectedDate(
                                            ""
                                        );

                                        setAvailableSlots(
                                            []
                                        );

                                        setSelectedSlots(
                                            []
                                        );

                                        setSelectedDays(
                                            []
                                        );
                                    }}
                                    className={
                                        selectedCourtId ===
                                        court.id
                                            ? "rounded-2xl border-2 border-green-600 bg-green-50 p-6 text-left font-semibold text-green-900"
                                            : "rounded-2xl border border-zinc-200 bg-white p-6 text-left text-zinc-800 transition hover:border-green-300"
                                    }
                                >
                                    {formatCourtName(
                                        court
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </section>

                <section className="mt-10">
                    <h2 className="text-2xl font-bold text-zinc-900">
                        2. Izaberi datum
                    </h2>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                        <input
                            type="date"
                            min={today}
                            value={
                                selectedDate
                            }
                            onChange={(e) => {
                                setSelectedDate(
                                    e.target
                                        .value
                                );

                                setAvailableSlots(
                                    []
                                );

                                setSelectedSlots(
                                    []
                                );
                            }}
                            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-zinc-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                        />

                        <button
                            type="button"
                            onClick={
                                loadAvailableSlots
                            }
                            disabled={
                                !selectedCourtId ||
                                !selectedDate ||
                                loadingSlots
                            }
                            className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loadingSlots
                                ? "Učitavanje..."
                                : "Prikaži slobodne termine"}
                        </button>
                    </div>
                </section>

                {selectedDate && (
                    <section className="mt-10">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900">
                                    3. Slobodni termini
                                </h2>

                                <p className="mt-2 capitalize text-zinc-600">
                                    {formatDate(
                                        selectedDate
                                    )}
                                </p>
                            </div>

                            <p className="text-sm text-zinc-500">
                                Maksimalno 4
                                uzastopna sata
                                po rezervaciji.
                            </p>
                        </div>

                        {loadingSlots && (
                            <div className="py-10 text-zinc-500">
                                Učitavanje termina...
                            </div>
                        )}

                        {!loadingSlots &&
                            availableSlots.length >
                            0 && (
                                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {availableSlots.map(
                                        (
                                            slot
                                        ) => {
                                            const selected =
                                                selectedSlots.some(
                                                    (
                                                        item
                                                    ) =>
                                                        item.startTime ===
                                                        slot.startTime
                                                );

                                            return (
                                                <button
                                                    key={
                                                        slot.startTime
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSlot(
                                                            slot
                                                        )
                                                    }
                                                    className={
                                                        selected
                                                            ? "rounded-xl bg-green-700 px-4 py-4 font-bold text-white"
                                                            : "rounded-xl border border-zinc-200 bg-white px-4 py-4 font-semibold text-zinc-800 transition hover:border-green-400 hover:bg-green-50"
                                                    }
                                                >
                                                    {formatTime(
                                                        slot.startTime
                                                    )}{" "}
                                                    –{" "}
                                                    {formatTime(
                                                        slot.endTime
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                        {!loadingSlots &&
                            selectedDate &&
                            availableSlots.length ===
                            0 && (
                                <p className="mt-6 text-zinc-500">
                                    Za ovaj datum
                                    trenutno nema
                                    slobodnih termina.
                                </p>
                            )}

                        {selectedSlots.length >
                            0 && (
                                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
                                    <p className="text-sm font-semibold text-green-800">
                                        Izabrani termin
                                    </p>

                                    <p className="mt-2 text-xl font-bold text-zinc-900">
                                        {formatTime(
                                            selectedSlots[0]
                                                .startTime
                                        )}{" "}
                                        –{" "}
                                        {formatTime(
                                            selectedSlots[
                                            selectedSlots.length -
                                            1
                                                ].endTime
                                        )}
                                    </p>

                                    <p className="mt-2 text-sm text-green-800">
                                        Trajanje:{" "}
                                        {
                                            selectedSlots.length
                                        }{" "}
                                        {selectedSlots.length ===
                                        1
                                            ? "sat"
                                            : selectedSlots.length <
                                            5
                                                ? "sata"
                                                : "sati"}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            addSelectedDay
                                        }
                                        className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
                                    >
                                        Dodaj ovaj datum
                                    </button>
                                </div>
                            )}
                    </section>
                )}

                {selectedDays.length >
                    0 && (
                        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-8">
                            <h2 className="text-2xl font-bold text-zinc-900">
                                Tvoji izabrani termini
                            </h2>

                            <p className="mt-2 text-zinc-600">
                                Možeš dodati više
                                dana. Za svaki datum
                                backend će dobiti
                                posebnu rezervaciju.
                            </p>

                            <div className="mt-6 space-y-3">
                                {selectedDays.map(
                                    (day) => {
                                        const slots =
                                            sortSlots(
                                                day.slots
                                            );

                                        return (
                                            <div
                                                key={
                                                    day.date
                                                }
                                                className="flex flex-col gap-4 rounded-2xl bg-zinc-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <p className="font-bold capitalize text-zinc-900">
                                                        {formatDate(
                                                            day.date
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-zinc-600">
                                                        {formatTime(
                                                            slots[0]
                                                                .startTime
                                                        )}{" "}
                                                        –{" "}
                                                        {formatTime(
                                                            slots[
                                                            slots.length -
                                                            1
                                                                ]
                                                                .endTime
                                                        )}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDay(
                                                            day.date
                                                        )
                                                    }
                                                    className="font-semibold text-red-600 transition hover:text-red-800"
                                                >
                                                    Ukloni
                                                </button>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={
                                        continueToPayment
                                    }
                                    className="rounded-xl bg-green-700 px-7 py-4 font-semibold text-white transition hover:bg-green-800"
                                >
                                    Nastavi na pregled →
                                </button>
                            </div>
                        </section>
                    )}

                {error && (
                    <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}