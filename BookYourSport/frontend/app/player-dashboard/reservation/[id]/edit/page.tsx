"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import PlayerHeader from "../../../PlayerHeader";
import Footer from "../../../../Footer";

type Price = {
    amount: number;
    currency: string;
};

type Reservation = {
    id: string;
    courtId: string;
    clubId: string;
    userId: string;
    startTime: string;
    endTime: string;
    price: Price;
    status: string;
};

type Availability = {
    startTime: string;
    endTime: string;
};

type User = {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
};

function getAuthHeaders() {
    const accessToken =
        localStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
            }
            : {}),
    };
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("sr-RS", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(dateString));
}

function formatTime(dateString: string) {
    return new Intl.DateTimeFormat("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(dateString));
}

function sortSlots(slots: Availability[]) {
    return [...slots].sort(
        (a, b) =>
            new Date(a.startTime).getTime() -
            new Date(b.startTime).getTime()
    );
}

function areSlotsConsecutive(
    slots: Availability[]
) {
    if (slots.length <= 1) {
        return true;
    }

    const sortedSlots =
        sortSlots(slots);

    for (
        let index = 0;
        index < sortedSlots.length - 1;
        index++
    ) {
        const currentEnd =
            new Date(
                sortedSlots[index].endTime
            ).getTime();

        const nextStart =
            new Date(
                sortedSlots[index + 1].startTime
            ).getTime();

        if (currentEnd !== nextStart) {
            return false;
        }
    }

    return true;
}

export default function EditReservationPage() {
    const params = useParams();
    const router = useRouter();

    const reservationId =
        params.id as string;

    const [
        reservation,
        setReservation,
    ] = useState<Reservation | null>(
        null
    );

    const [
        selectedDate,
        setSelectedDate,
    ] = useState("");

    const [
        availableSlots,
        setAvailableSlots,
    ] = useState<Availability[]>([]);

    // SADA MOZEMO IMATI VISE TERMINA
    const [
        selectedSlots,
        setSelectedSlots,
    ] = useState<Availability[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [
        loadingAvailability,
        setLoadingAvailability,
    ] = useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==========================================
    // UCITAVANJE KONKRETNE REZERVACIJE
    // ==========================================

    useEffect(() => {
        async function loadReservation() {
            try {
                setLoading(true);
                setError("");

                const savedUser =
                    localStorage.getItem(
                        "user"
                    );

                if (!savedUser) {
                    throw new Error(
                        "Korisnik nije prijavljen."
                    );
                }

                const user: User =
                    JSON.parse(savedUser);

                if (!user.id) {
                    throw new Error(
                        "Nije moguće pronaći korisnika."
                    );
                }

                const response =
                    await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/reservations/user/${user.id}`,
                        {
                            headers:
                                getAuthHeaders(),
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Nije moguće učitati rezervaciju."
                    );
                }

                const reservations: Reservation[] =
                    await response.json();

                const foundReservation =
                    reservations.find(
                        (item) =>
                            item.id ===
                            reservationId
                    );

                if (!foundReservation) {
                    throw new Error(
                        "Rezervacija nije pronađena."
                    );
                }

                setReservation(
                    foundReservation
                );

                setSelectedDate(
                    foundReservation.startTime.split(
                        "T"
                    )[0]
                );
            } catch (error) {
                console.error(error);

                setError(
                    error instanceof Error
                        ? error.message
                        : "Došlo je do greške."
                );
            } finally {
                setLoading(false);
            }
        }

        loadReservation();
    }, [reservationId]);

    // ==========================================
    // UCITAVANJE SLOBODNIH TERMINA
    // ==========================================

    async function loadAvailability() {
        if (
            !reservation ||
            !selectedDate
        ) {
            return;
        }

        try {
            setLoadingAvailability(true);
            setError("");

            // MENJANJEMO DATUM ILI PONOVO UCITAVAMO
            // -> BRISU SE PRETHODNO IZABRANI TERMINI
            setSelectedSlots([]);

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${reservation.clubId}/courts/${reservation.courtId}/availability?date=${selectedDate}`,
                    {
                        headers:
                            getAuthHeaders(),
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Nije moguće učitati slobodne termine."
                );
            }

            const data: Availability[] =
                await response.json();

            setAvailableSlots(
                sortSlots(data)
            );
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Nije moguće učitati termine."
            );

            setAvailableSlots([]);
        } finally {
            setLoadingAvailability(false);
        }
    }

    useEffect(() => {
        if (
            reservation &&
            selectedDate
        ) {
            loadAvailability();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        reservation,
        selectedDate,
    ]);

    // ==========================================
    // IZBOR TERMINA
    // MAKSIMUM 4 SATA
    // TERMINI MORAJU BITI UZASTOPNI
    // ==========================================

    function handleSlotClick(
        slot: Availability
    ) {
        setError("");

        const alreadySelected =
            selectedSlots.some(
                (selectedSlot) =>
                    selectedSlot.startTime ===
                    slot.startTime
            );

        // Ako je vec selektovan -> uklanjamo ga
        if (alreadySelected) {
            setSelectedSlots(
                selectedSlots.filter(
                    (selectedSlot) =>
                        selectedSlot.startTime !==
                        slot.startTime
                )
            );

            return;
        }

        // BACKEND DOZVOLJAVA MAKSIMUM 4 SATA
        if (selectedSlots.length >= 4) {
            setError(
                "Maksimalno možeš izabrati 4 uzastopna sata."
            );

            return;
        }

        const newSelection =
            sortSlots([
                ...selectedSlots,
                slot,
            ]);

        // Rezervacija mora predstavljati
        // jedan neprekinut vremenski opseg
        if (
            !areSlotsConsecutive(
                newSelection
            )
        ) {
            setError(
                "Možeš izabrati samo uzastopne termine."
            );

            return;
        }

        setSelectedSlots(
            newSelection
        );
    }

    // ==========================================
    // RESCHEDULE
    // ==========================================

    async function handleReschedule() {
        if (
            !reservation ||
            selectedSlots.length === 0
        ) {
            return;
        }

        if (
            selectedSlots.length > 4
        ) {
            setError(
                "Rezervacija ne može trajati duže od 4 sata."
            );

            return;
        }

        const sortedSlots =
            sortSlots(selectedSlots);

        const newStartTime =
            sortedSlots[0].startTime;

        const newEndTime =
            sortedSlots[
            sortedSlots.length - 1
                ].endTime;

        try {
            setSaving(true);
            setError("");

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/reservations/${reservation.id}/reschedule`,
                    {
                        method: "PUT",

                        headers:
                            getAuthHeaders(),

                        // TACNO DTO KOJI BACKEND OCEKUJE
                        body: JSON.stringify({
                            newStartTime,
                            newEndTime,
                        }),
                    }
                );

            if (!response.ok) {
                let message =
                    "Nije moguće izmeniti rezervaciju.";

                try {
                    const errorData =
                        await response.json();

                    if (
                        errorData?.message
                    ) {
                        message =
                            errorData.message;
                    }
                } catch {
                    // Ako backend ne vrati JSON,
                    // ostaje osnovna poruka.
                }

                throw new Error(
                    message
                );
            }

            router.push(
                "/player-dashboard/reservation"
            );

            router.refresh();
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Došlo je do greške."
            );
        } finally {
            setSaving(false);
        }
    }

    // ==========================================
    // INFO O NOVOM TERMINU
    // ==========================================

    const sortedSelectedSlots =
        sortSlots(selectedSlots);

    const selectedStartTime =
        sortedSelectedSlots.length > 0
            ? sortedSelectedSlots[0]
                .startTime
            : null;

    const selectedEndTime =
        sortedSelectedSlots.length > 0
            ? sortedSelectedSlots[
            sortedSelectedSlots.length -
            1
                ].endTime
            : null;

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                    <p className="text-zinc-600">
                        Učitavanje rezervacije...
                    </p>
                </section>

                <Footer />
            </main>
        );
    }

    // ==========================================
    // ERROR PRI UCITAVANJU
    // ==========================================

    if (
        error &&
        !reservation
    ) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
                        {error}
                    </div>

                    <Link
                        href="/player-dashboard/reservation"
                        className="mt-6 inline-block font-semibold text-green-700 hover:underline"
                    >
                        ← Nazad na moje rezervacije
                    </Link>
                </section>

                <Footer />
            </main>
        );
    }

    if (!reservation) {
        return null;
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                <Link
                    href="/player-dashboard/reservation"
                    className="text-sm font-semibold text-green-700 hover:underline"
                >
                    ← Moje rezervacije
                </Link>

                <div className="mt-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                        Izmena rezervacije
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-zinc-900">
                        Izmeni termin rezervacije
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Trenutni termin:{" "}

                        <span className="font-semibold">
                            {formatDate(
                                reservation.startTime
                            )}
                        </span>

                        {" · "}

                        <span className="font-semibold">
                            {formatTime(
                                reservation.startTime
                            )}

                            {" - "}

                            {formatTime(
                                reservation.endTime
                            )}
                        </span>
                    </p>
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                    {/* DATUM */}

                    <label className="block">
                        <span className="text-sm font-semibold text-zinc-900">
                            Izaberi novi datum
                        </span>

                        <input
                            type="date"
                            value={
                                selectedDate
                            }
                            min={
                                new Date()
                                    .toISOString()
                                    .split("T")[0]
                            }
                            onChange={(
                                event
                            ) =>
                                setSelectedDate(
                                    event.target
                                        .value
                                )
                            }
                            className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                        />
                    </label>

                    {/* TERMINI */}

                    <div className="mt-10">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-bold text-zinc-900">
                                Slobodni termini
                            </h2>

                            <p className="text-sm text-zinc-500">
                                Možeš izabrati
                                od 1 do 4
                                uzastopna sata.
                            </p>
                        </div>

                        {loadingAvailability && (
                            <p className="mt-5 text-zinc-500">
                                Učitavanje
                                slobodnih termina...
                            </p>
                        )}

                        {!loadingAvailability &&
                            availableSlots.length ===
                            0 && (
                                <p className="mt-5 text-zinc-500">
                                    Nema slobodnih
                                    termina za
                                    izabrani datum.
                                </p>
                            )}

                        {!loadingAvailability &&
                            availableSlots.length >
                            0 && (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {availableSlots.map(
                                        (
                                            slot,
                                            index
                                        ) => {
                                            const isSelected =
                                                selectedSlots.some(
                                                    (
                                                        selectedSlot
                                                    ) =>
                                                        selectedSlot.startTime ===
                                                        slot.startTime
                                                );

                                            const maximumReached =
                                                selectedSlots.length >=
                                                4 &&
                                                !isSelected;

                                            return (
                                                <button
                                                    key={`${slot.startTime}-${index}`}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSlotClick(
                                                            slot
                                                        )
                                                    }
                                                    disabled={
                                                        maximumReached
                                                    }
                                                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                                                        isSelected
                                                            ? "border-green-700 bg-green-700 text-white"
                                                            : "border-zinc-300 bg-white text-zinc-900 hover:border-green-500"
                                                    } ${
                                                        maximumReached
                                                            ? "cursor-not-allowed opacity-50"
                                                            : ""
                                                    }`}
                                                >
                                                    {formatTime(
                                                        slot.startTime
                                                    )}

                                                    {" - "}

                                                    {formatTime(
                                                        slot.endTime
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                        {/* IZABRANI TERMINI */}

                        {selectedSlots.length >
                            0 && (
                                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                                        Izabrano
                                    </p>

                                    <p className="mt-2 font-semibold text-zinc-900">
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

                                    {selectedStartTime &&
                                        selectedEndTime && (
                                            <p className="mt-2 text-sm text-zinc-700">
                                                Novi termin:{" "}

                                                <span className="font-semibold">
                                                {formatTime(
                                                    selectedStartTime
                                                )}

                                                    {" - "}

                                                    {formatTime(
                                                        selectedEndTime
                                                    )}
                                            </span>
                                            </p>
                                        )}
                                </div>
                            )}
                    </div>

                    {/* BUTTONS */}

                    <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-8 sm:flex-row sm:justify-end">
                        <Link
                            href="/player-dashboard/reservation"
                            className="rounded-lg border border-zinc-300 px-5 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                        >
                            Odustani
                        </Link>

                        <button
                            type="button"
                            onClick={
                                handleReschedule
                            }
                            disabled={
                                selectedSlots.length ===
                                0 ||
                                saving
                            }
                            className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Izmena u toku..."
                                : "Potvrdi novi termin"}
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}