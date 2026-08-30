"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../Header";
import Footer from "../../Footer";

type Club = {
    id: string;
    name: string;
    address?: string;
    city?: string;
    description?: string;
};

type Court = {
    id: string;
    name: string;
    courtType?: string;
};

type AvailableSlot = {
    startTime: string;
    endTime: string;
};

export default function ClubDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const clubId = params.clubId as string;

    const [club, setClub] =
        useState<Club | null>(null);

    const [courts, setCourts] =
        useState<Court[]>([]);

    const [selectedCourtId, setSelectedCourtId] =
        useState("");

    const [selectedDate, setSelectedDate] =
        useState("");

    const [availableSlots, setAvailableSlots] =
        useState<AvailableSlot[]>([]);

    const [loadingClub, setLoadingClub] =
        useState(true);

    const [loadingSlots, setLoadingSlots] =
        useState(false);

    const [error, setError] =
        useState("");

    const [reservationMessage, setReservationMessage] =
        useState("");

    // ==========================================
    // DOHVAT KLUBA
    // ==========================================

    useEffect(() => {
        async function loadClub() {
            try {
                setLoadingClub(true);
                setError("");

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs/${clubId}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Klub nije pronađen."
                    );
                }

                const data = await response.json();

                setClub(data);
            } catch (error) {
                console.error(error);

                setError(
                    "Došlo je do greške prilikom učitavanja kluba."
                );
            } finally {
                setLoadingClub(false);
            }
        }

        loadClub();
    }, [clubId]);

    // ==========================================
    // DOHVAT TERENA KLUBA
    // ==========================================

    useEffect(() => {
        async function loadCourts() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs/${clubId}/courts`
                );

                if (!response.ok) {
                    throw new Error(
                        "Tereni nisu pronađeni."
                    );
                }

                const data = await response.json();

                setCourts(data);

                // Automatski biramo prvi teren
                if (data.length > 0) {
                    setSelectedCourtId(
                        data[0].id
                    );
                }
            } catch (error) {
                console.error(error);

                setError(
                    "Došlo je do greške prilikom učitavanja terena."
                );
            }
        }

        loadCourts();
    }, [clubId]);

    // ==========================================
    // DOHVAT SLOBODNIH TERMINA
    // ==========================================

    async function loadAvailableSlots() {
        if (!selectedCourtId || !selectedDate) {
            return;
        }

        try {
            setLoadingSlots(true);
            setError("");
            setAvailableSlots([]);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs/${clubId}/courts/${selectedCourtId}/availability?date=${selectedDate}`
            );

            if (!response.ok) {
                throw new Error(
                    "Slobodni termini nisu dostupni."
                );
            }

            const data = await response.json();

            setAvailableSlots(data);
        } catch (error) {
            console.error(error);

            setError(
                "Došlo je do greške prilikom učitavanja slobodnih termina."
            );
        } finally {
            setLoadingSlots(false);
        }
    }

    // ==========================================
    // REZERVACIJA TERMINA
    // ==========================================

    async function createReservation(
        slot: AvailableSlot
    ) {
        setError("");
        setReservationMessage("");

        // Proveravamo da li je korisnik ulogovan
        const token =
            localStorage.getItem("accessToken");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs/${clubId}/courts/${selectedCourtId}/reservations`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        date: selectedDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Rezervacija nije uspešna."
                );

                return;
            }

            setReservationMessage(
                "Uspešno ste rezervisali termin!"
            );

            // Ponovo učitavamo termine
            await loadAvailableSlots();

        } catch (error) {
            console.error(error);

            setError(
                "Došlo je do greške prilikom rezervacije."
            );
        }
    }

    // ==========================================
    // MINIMALNI DATUM = DANAS
    // ==========================================

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    if (loadingClub) {
        return (
            <main>
                <Header />

                <div className="mx-auto min-h-screen max-w-6xl px-6 py-20">
                    Učitavanje kluba...
                </div>

                <Footer />
            </main>
        );
    }

    if (!club) {
        return (
            <main>
                <Header />

                <div className="mx-auto min-h-screen max-w-6xl px-6 py-20">
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

                {/* ================================= */}
                {/* INFORMACIJE O KLUBU */}
                {/* ================================= */}

                <section className="mb-10">

                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                        Teniski klub
                    </span>

                    <h1 className="mt-2 text-4xl font-bold text-zinc-900">
                        {club.name}
                    </h1>

                    {(club.address || club.city) && (
                        <p className="mt-3 text-zinc-600">
                            📍 {club.address}
                            {club.address && club.city && ", "}
                            {club.city}
                        </p>
                    )}

                    {club.description && (
                        <p className="mt-4 max-w-3xl text-zinc-600">
                            {club.description}
                        </p>
                    )}

                </section>

                {/* ================================= */}
                {/* REZERVACIJA */}
                {/* ================================= */}

                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

                    <h2 className="text-2xl font-bold text-zinc-900">
                        Rezerviši termin
                    </h2>

                    <p className="mt-2 text-zinc-500">
                        Izaberi teren i datum da vidiš
                        dostupne termine.
                    </p>


                    {/* ================================= */}
                    {/* IZBOR TERENA */}
                    {/* ================================= */}

                    <div className="mt-8">

                        <label className="mb-3 block font-semibold text-zinc-700">
                            Izaberi teren
                        </label>

                        <select
                            value={selectedCourtId}
                            onChange={(e) => {
                                setSelectedCourtId(
                                    e.target.value
                                );

                                setAvailableSlots([]);
                            }}
                            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-green-600"
                        >
                            {courts.length === 0 && (
                                <option>
                                    Nema dostupnih terena
                                </option>
                            )}

                            {courts.map((court) => (
                                <option
                                    key={court.id}
                                    value={court.id}
                                >
                                    {court.name}
                                    {court.courtType
                                        ? ` - ${court.courtType}`
                                        : ""}
                                </option>
                            ))}
                        </select>

                    </div>


                    {/* ================================= */}
                    {/* IZBOR DATUMA */}
                    {/* ================================= */}

                    <div className="mt-6">

                        <label className="mb-3 block font-semibold text-zinc-700">
                            Izaberi datum
                        </label>

                        <input
                            type="date"
                            min={today}
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(
                                    e.target.value
                                );

                                setAvailableSlots([]);
                            }}
                            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-green-600"
                        />

                    </div>


                    {/* ================================= */}
                    {/* BUTTON ZA TERMIN */}
                    {/* ================================= */}

                    <button
                        type="button"
                        disabled={
                            !selectedCourtId ||
                            !selectedDate ||
                            loadingSlots
                        }
                        onClick={loadAvailableSlots}
                        className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingSlots
                            ? "Učitavanje..."
                            : "Prikaži slobodne termine"}
                    </button>


                    {/* ================================= */}
                    {/* ERROR */}
                    {/* ================================= */}

                    {error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
                            {error}
                        </div>
                    )}


                    {/* ================================= */}
                    {/* SUCCESS */}
                    {/* ================================= */}

                    {reservationMessage && (
                        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                            {reservationMessage}
                        </div>
                    )}


                    {/* ================================= */}
                    {/* SLOBODNI TERMINI */}
                    {/* ================================= */}

                    {availableSlots.length > 0 && (
                        <div className="mt-8">

                            <h3 className="text-lg font-bold text-zinc-900">
                                Slobodni termini
                            </h3>

                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                                {availableSlots.map(
                                    (slot) => (
                                        <button
                                            key={`${slot.startTime}-${slot.endTime}`}
                                            type="button"
                                            onClick={() =>
                                                createReservation(
                                                    slot
                                                )
                                            }
                                            className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 font-semibold text-green-800 transition hover:bg-green-700 hover:text-white"
                                        >
                                            {slot.startTime}
                                            {" - "}
                                            {slot.endTime}
                                        </button>
                                    )
                                )}

                            </div>

                        </div>
                    )}


                    {/* NEMA TERMINA */}

                    {!loadingSlots &&
                        selectedDate &&
                        availableSlots.length === 0 && (
                            <p className="mt-6 text-zinc-500">
                                Izaberi opcije i klikni na
                                „Prikaži slobodne termine".
                            </p>
                        )}

                </section>

            </div>

            <Footer />

        </main>
    );
}