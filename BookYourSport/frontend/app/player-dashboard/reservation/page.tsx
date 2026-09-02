"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";

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

type User = {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
};

function formatDate(dateString: string) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("sr-RS", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatTime(dateString: string) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatPrice(price: Price) {
    if (!price) {
        return "";
    }

    return (
        new Intl.NumberFormat("sr-RS", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price.amount) + ` ${price.currency}`
    );
}

export default function ReservationPage() {
    const [reservations, setReservations] =
        useState<Reservation[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [cancelingId, setCancelingId] =
        useState<string | null>(null);

    const [actionError, setActionError] =
        useState("");

    useEffect(() => {
        async function loadReservations() {
            try {
                setLoading(true);
                setError("");

                const savedUser =
                    localStorage.getItem("user");

                const accessToken =
                    localStorage.getItem("accessToken");

                if (!savedUser) {
                    setError(
                        "Nisi prijavljen."
                    );

                    return;
                }

                const user: User =
                    JSON.parse(savedUser);

                if (!user.id) {
                    setError(
                        "Nije moguće pronaći korisnički nalog."
                    );

                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/reservations/user/${user.id}`,
                    {
                        headers: {
                            ...(accessToken
                                ? {
                                    Authorization: `Bearer ${accessToken}`,
                                }
                                : {}),
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Rezervacije nisu dostupne."
                    );
                }

                const data =
                    await response.json();

                setReservations(data);
            } catch (error) {
                console.error(error);

                setError(
                    "Nije moguće učitati rezervacije."
                );
            } finally {
                setLoading(false);
            }
        }

        loadReservations();
    }, []);

    async function cancelReservation(
        reservationId: string
    ) {
        const confirmed = window.confirm(
            "Da li si sigurna da želiš da otkažeš ovu rezervaciju?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setCancelingId(reservationId);
            setActionError("");

            const accessToken =
                localStorage.getItem("accessToken");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/reservations/${reservationId}/cancel`,
                {
                    method: "PUT",
                    headers: {
                        ...(accessToken
                            ? {
                                Authorization: `Bearer ${accessToken}`,
                            }
                            : {}),
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Rezervaciju nije moguće otkazati."
                );
            }

            setReservations((currentReservations) =>
                currentReservations.map(
                    (reservation) =>
                        reservation.id === reservationId
                            ? {
                                ...reservation,
                                status: "Canceled",
                            }
                            : reservation
                )
            );
        } catch (error) {
            console.error(error);

            setActionError(
                "Nije moguće otkazati rezervaciju. Pokušaj ponovo."
            );
        } finally {
            setCancelingId(null);
        }
    }

    const activeReservations = useMemo(() => {
        const now = new Date();

        return reservations.filter(
            (reservation) => {
                const start =
                    new Date(
                        reservation.startTime
                    );

                const status =
                    reservation.status.toLowerCase();

                const isCancelled =
                    status.includes(
                        "cancel"
                    );

                return (
                    start >= now &&
                    !isCancelled
                );
            }
        );
    }, [reservations]);

    const reservationHistory = useMemo(() => {
        const now = new Date();

        return reservations.filter(
            (reservation) => {
                const start =
                    new Date(
                        reservation.startTime
                    );

                const status =
                    reservation.status.toLowerCase();

                const isCancelled =
                    status.includes(
                        "cancel"
                    );

                return (
                    start < now ||
                    isCancelled
                );
            }
        );
    }, [reservations]);

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
                <Link
                    href="/player-dashboard"
                    className="mb-5 inline-block text-sm font-semibold text-green-700 transition hover:text-green-900 hover:underline"
                >
                    ← Nazad na moj nalog
                </Link>
                <div className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">
                            Moje rezervacije
                        </h1>

                        <p className="mt-3 text-zinc-600">
                            Pregled predstojećih i prethodnih
                            rezervacija.
                        </p>
                    </div>

                    <Link
                        href="/clubs"
                        className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                        Pronađi teren
                    </Link>
                </div>

                {loading && (
                    <div className="py-20 text-center text-zinc-500">
                        Učitavanje rezervacija...
                    </div>
                )}

                {error && (
                    <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
                        {error}
                    </div>
                )}

                {actionError && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
                        {actionError}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* AKTIVNE REZERVACIJE */}

                        <section className="mt-10">
                            <h2 className="text-xl font-semibold text-zinc-900">
                                Aktivne rezervacije
                            </h2>

                            {activeReservations.length ===
                            0 ? (
                                <div className="mt-5 rounded-xl border border-zinc-200 bg-white">
                                    <div className="px-6 py-10 text-center">
                                        <p className="text-zinc-600">
                                            Trenutno nemaš aktivnih
                                            rezervacija.
                                        </p>

                                        <Link
                                            href="/clubs"
                                            className="mt-5 inline-block text-sm font-semibold text-green-700 hover:underline"
                                        >
                                            Pronađi slobodan termin
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-5">
                                    {activeReservations.map(
                                        (
                                            reservation
                                        ) => (
                                            <div
                                                key={
                                                    reservation.id
                                                }
                                                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
                                            >
                                                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                                                    <div>
                                                        <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
                                                            Aktivna
                                                            rezervacija
                                                        </p>

                                                        <h3 className="mt-2 text-xl font-bold text-zinc-900">
                                                            {formatDate(
                                                                reservation.startTime
                                                            )}
                                                        </h3>

                                                        <p className="mt-2 text-zinc-600">
                                                            🕒{" "}
                                                            {formatTime(
                                                                reservation.startTime
                                                            )}
                                                            {" - "}
                                                            {formatTime(
                                                                reservation.endTime
                                                            )}
                                                        </p>

                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            Cena:{" "}
                                                            <span className="font-semibold text-zinc-800">
                                                                {formatPrice(
                                                                    reservation.price
                                                                )}
                                                            </span>
                                                        </p>

                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            Status:{" "}
                                                            <span className="font-semibold text-green-700">
                                                                {
                                                                    reservation.status
                                                                }
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-3 sm:items-end">
                                                        <Link
                                                            href={`/player-dashboard/reservation/${reservation.id}`}
                                                            className="text-sm font-bold text-green-700 transition hover:text-green-800 hover:underline"
                                                        >
                                                            Pogledaj detalje →
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            onClick={() =>
                                                                cancelReservation(
                                                                    reservation.id
                                                                )
                                                            }
                                                            disabled={
                                                                cancelingId ===
                                                                reservation.id
                                                            }
                                                        >
                                                            {cancelingId ===
                                                            reservation.id
                                                                ? "Otkazivanje..."
                                                                : "Otkaži rezervaciju"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        {/* ISTORIJA */}

                        <section className="mt-12">
                            <h2 className="text-xl font-semibold text-zinc-900">
                                Istorija rezervacija
                            </h2>

                            {reservationHistory.length ===
                            0 ? (
                                <div className="mt-5 rounded-xl border border-zinc-200 bg-white">
                                    <div className="px-6 py-10 text-center">
                                        <p className="text-zinc-600">
                                            Još uvek nemaš prethodnih
                                            rezervacija.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-5">
                                    {reservationHistory.map(
                                        (
                                            reservation
                                        ) => (
                                            <div
                                                key={
                                                    reservation.id
                                                }
                                                className="rounded-xl border border-zinc-200 bg-white p-6"
                                            >
                                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                                    <div>
                                                        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                                                            Prethodna
                                                            rezervacija
                                                        </p>

                                                        <h3 className="mt-2 text-lg font-bold text-zinc-900">
                                                            {formatDate(
                                                                reservation.startTime
                                                            )}
                                                        </h3>

                                                        <p className="mt-2 text-sm text-zinc-600">
                                                            🕒{" "}
                                                            {formatTime(
                                                                reservation.startTime
                                                            )}
                                                            {" - "}
                                                            {formatTime(
                                                                reservation.endTime
                                                            )}
                                                        </p>

                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            Cena:{" "}
                                                            {formatPrice(
                                                                reservation.price
                                                            )}
                                                        </p>

                                                        <p className="mt-2 text-sm text-zinc-500">
                                                            Status:{" "}
                                                            {reservation.status}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href={`/player-dashboard/reservation/${reservation.id}`}
                                                        className="text-sm font-bold text-green-700 transition hover:text-green-800 hover:underline"
                                                    >
                                                        Pogledaj detalje →
                                                    </Link>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </section>

            <Footer />
        </main>
    );
}