"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";
import { getAccessToken } from "@/lib/auth";
import {
    getMyReservations,
    getClub,
    Reservation,
    Club,
} from "@/lib/reservationApi";

function getUserIdFromToken(token: string): string | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return null;
        }

        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decodedPayload = JSON.parse(
            decodeURIComponent(
                window
                    .atob(base64)
                    .split("")
                    .map(
                        (character) =>
                            "%" +
                            (
                                "00" +
                                character.charCodeAt(0).toString(16)
                            ).slice(-2)
                    )
                    .join("")
            )
        );

        return (
            decodedPayload.sub ||
            decodedPayload.userId ||
            decodedPayload.nameid ||
            decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                ] ||
            null
        );
    } catch (error) {
        console.error(
            "Ne mogu da pročitam user ID iz tokena:",
            error
        );

        return null;
    }
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatPrice(amount: number, currency = "RSD") {
    return new Intl.NumberFormat("sr-Latn-RS", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

/*
 * Rezervacija sama po sebi ne nosi ime kluba/terena,
 * pa ih dodajemo naknadno (enrichujemo) na frontu
 * na osnovu clubId / courtId.
 */
type EnrichedReservation = Reservation & {
    clubName?: string;
    courtName?: string;
};

type ReservationTab = "active" | "history";

/*
 * "Aktivna" rezervacija = nije otkazana i termin
 * joj se još nije završio. Sve ostalo (otkazane
 * i prošle rezervacije) ide u istoriju.
 */
function isUpcoming(reservation: EnrichedReservation) {
    const notCancelled =
        reservation.status.toLowerCase() !== "cancelled";

    const notFinishedYet =
        new Date(reservation.endTime).getTime() >=
        Date.now();

    return notCancelled && notFinishedYet;
}

function MyReservationsPageContent() {
    const searchParams = useSearchParams();

    const initialTab: ReservationTab =
        searchParams.get("view") === "history"
            ? "history"
            : "active";

    const [activeTab, setActiveTab] =
        useState<ReservationTab>(initialTab);

    const [reservations, setReservations] = useState<
        EnrichedReservation[]
    >([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReservations() {
            try {
                setLoading(true);
                setError("");

                const token = getAccessToken();

                if (!token) {
                    throw new Error("Korisnik nije prijavljen.");
                }

                const userId = getUserIdFromToken(token);

                if (!userId) {
                    throw new Error(
                        "Ne mogu da pronađem ID korisnika."
                    );
                }

                /*
                 * 1. Sve rezervacije ulogovanog igrača
                 */
                const myReservations = await getMyReservations(
                    userId
                );

                /*
                 * 2. Za svaki jedinstven klub iz rezervacija
                 * dovlačimo podatke o klubu (ima i listu terena),
                 * kako bismo prikazali ime kluba i terena.
                 */
                const uniqueClubIds = Array.from(
                    new Set(
                        myReservations.map(
                            (reservation) => reservation.clubId
                        )
                    )
                );

                const clubsById = new Map<string, Club>();

                await Promise.all(
                    uniqueClubIds.map(async (clubId) => {
                        try {
                            const club = await getClub(clubId);
                            clubsById.set(clubId, club);
                        } catch (clubError) {
                            console.error(
                                "Ne mogu da učitam klub:",
                                clubId,
                                clubError
                            );
                        }
                    })
                );

                const enriched: EnrichedReservation[] =
                    myReservations.map((reservation) => {
                        const club = clubsById.get(
                            reservation.clubId
                        );

                        const court = club?.courts?.find(
                            (item) =>
                                item.id === reservation.courtId
                        );

                        return {
                            ...reservation,
                            clubName: club?.name,
                            courtName: court?.name,
                        };
                    });

                /*
                 * Predstojeći termini prvo (najraniji prvo),
                 * pa tek onda otkazani/prošli.
                 */
                enriched.sort((a, b) => {
                    const aCanceled =
                        a.status.toLowerCase() === "cancelled";
                    const bCanceled =
                        b.status.toLowerCase() === "cancelled";

                    if (aCanceled !== bCanceled) {
                        return aCanceled ? 1 : -1;
                    }

                    return (
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    );
                });

                setReservations(enriched);
            } catch (loadError) {
                console.error(
                    "Greška prilikom učitavanja rezervacija:",
                    loadError
                );

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Došlo je do greške prilikom učitavanja rezervacija."
                );
            } finally {
                setLoading(false);
            }
        }

        loadReservations();
    }, []);

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Rezervacije
                </p>

                <h1 className="mt-3 text-3xl font-bold text-zinc-900">
                    Moje rezervacije
                </h1>

                <p className="mt-2 text-zinc-600">
                    Pregled svih tvojih rezervisanih termina.
                </p>

                {/* TABOVI: AKTIVNE / ISTORIJA */}

                <div className="mt-6 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
                    <button
                        type="button"
                        onClick={() =>
                            setActiveTab("active")
                        }
                        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                            activeTab === "active"
                                ? "bg-green-700 text-white"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        Aktivne
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setActiveTab("history")
                        }
                        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                            activeTab === "history"
                                ? "bg-green-700 text-white"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        Istorija
                    </button>
                </div>

                {loading && (
                    <p className="mt-10 text-zinc-600">
                        Učitavanje rezervacija...
                    </p>
                )}

                {!loading && error && (
                    <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    reservations.length === 0 && (
                        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                            <p className="text-zinc-600">
                                Još uvek nemaš nijednu rezervaciju.
                            </p>

                            <Link
                                href="/clubs"
                                className="mt-4 inline-block font-semibold text-green-700 hover:underline"
                            >
                                Pronađi teren i rezerviši →
                            </Link>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    reservations.length > 0 &&
                    (() => {
                        const visibleReservations =
                            reservations.filter(
                                (reservation) =>
                                    activeTab === "history"
                                        ? !isUpcoming(
                                            reservation
                                        )
                                        : isUpcoming(
                                            reservation
                                        )
                            );

                        if (visibleReservations.length === 0) {
                            return (
                                <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                                    <p className="text-zinc-600">
                                        {activeTab === "history"
                                            ? "Nemaš još nijednu rezervaciju u istoriji."
                                            : "Nemaš nijednu aktivnu rezervaciju."}
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <div className="mt-8 space-y-4">
                                {visibleReservations.map((reservation) => {
                                    const isCanceled =
                                        reservation.status.toLowerCase() ===
                                        "cancelled";

                                    return (
                                        <Link
                                            key={reservation.id}
                                            href={`/player-dashboard/reservation/${reservation.id}`}
                                            className="block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-bold text-zinc-900">
                                                        {reservation.clubName ||
                                                            "Klub"}
                                                        {reservation.courtName
                                                            ? ` · ${reservation.courtName}`
                                                            : ""}
                                                    </p>

                                                    <p className="mt-1 text-sm text-zinc-600">
                                                        {formatDate(
                                                            reservation.startTime
                                                        )}
                                                        {" · "}
                                                        {formatTime(
                                                            reservation.startTime
                                                        )}
                                                        {" - "}
                                                        {formatTime(
                                                            reservation.endTime
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                                                        {formatPrice(
                                                            reservation.price
                                                                .amount,
                                                            reservation.price
                                                                .currency
                                                        )}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`inline-block w-fit rounded-full px-4 py-1.5 text-xs font-semibold ${
                                                        isCanceled
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                            {reservation.status}
                                        </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })()}
            </section>

            <Footer />
        </main>
    );
}

export default function MyReservationsPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen flex-col bg-zinc-50">
                    <PlayerHeader />

                    <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                        <p className="text-zinc-600">
                            Učitavanje...
                        </p>
                    </section>

                    <Footer />
                </main>
            }
        >
            <MyReservationsPageContent />
        </Suspense>
    );
}
