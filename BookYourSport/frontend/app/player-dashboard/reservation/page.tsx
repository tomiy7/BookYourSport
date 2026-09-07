"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import PlayerHeader from "./../PlayerHeader";
import Footer from "./../../Footer";
import { getAccessToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

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

type Address = {
    city?: string;
    municipality?: string;
    zipCode?: string;
    street?: string;
    streetNumber?: string;
    country?: string;
};

type Club = {
    id: string;
    name: string;
    description?: string;
    address?: Address | string;
};

type Court = {
    id: string;
    name?: string;
    courtName?: string;
    type?: string;
    surface?: string;
};

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
    return new Date(
        dateString
    ).toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(dateString: string) {
    return new Date(
        dateString
    ).toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAddress(address?: Address | string) {
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

export default function ReservationDetailsPage() {
    const params = useParams();

    const reservationId = params.id as string;

    const [reservation, setReservation] =
        useState<Reservation | null>(null);

    const [club, setClub] =
        useState<Club | null>(null);

    const [court, setCourt] =
        useState<Court | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReservation() {
            try {
                setLoading(true);
                setError("");

                const token = getAccessToken();

                if (!token) {
                    throw new Error(
                        "Korisnik nije prijavljen."
                    );
                }

                const userId =
                    getUserIdFromToken(token);

                if (!userId) {
                    throw new Error(
                        "Ne mogu da pronađem ID korisnika."
                    );
                }

                /*
                 * 1. Dohvatamo sve rezervacije korisnika
                 */
                const reservationsResponse =
                    await apiFetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/reservations/user/${userId}`,
                        {
                            method: "GET",
                        }
                    );

                if (!reservationsResponse.ok) {
                    throw new Error(
                        `Ne mogu učitati rezervacije. Status: ${reservationsResponse.status}`
                    );
                }

                const reservations: Reservation[] =
                    await reservationsResponse.json();

                /*
                 * 2. Pronalazimo rezervaciju
                 * prema ID-u iz URL-a
                 */
                const foundReservation =
                    reservations.find(
                        (item) =>
                            item.id === reservationId
                    );

                if (!foundReservation) {
                    throw new Error(
                        "Rezervacija nije pronađena."
                    );
                }

                setReservation(
                    foundReservation
                );

                console.log(
                    "Pronađena rezervacija:",
                    foundReservation
                );

                /*
                 * 3. Dohvatamo klub i teren paralelno
                 */
                const [
                    clubResponse,
                    courtResponse,
                ] = await Promise.all([
                    apiFetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${foundReservation.clubId}`,
                        {
                            method: "GET",
                        }
                    ),

                    apiFetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${foundReservation.clubId}/courts/${foundReservation.courtId}`,
                        {
                            method: "GET",
                        }
                    ),
                ]);

                /*
                 * Klub
                 */
                if (clubResponse.ok) {
                    const clubData =
                        await clubResponse.json();

                    console.log(
                        "Club:",
                        clubData
                    );

                    setClub(clubData);
                } else {
                    console.error(
                        "Ne mogu da učitam klub:",
                        clubResponse.status
                    );
                }

                /*
                 * Teren
                 */
                if (courtResponse.ok) {
                    const courtData =
                        await courtResponse.json();

                    console.log(
                        "Court:",
                        courtData
                    );

                    setCourt(courtData);
                } else {
                    console.error(
                        "Ne mogu da učitam teren:",
                        courtResponse.status
                    );
                }
            } catch (error) {
                console.error(
                    "Greška prilikom učitavanja rezervacije:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Došlo je do greške prilikom učitavanja rezervacije."
                );
            } finally {
                setLoading(false);
            }
        }

        if (reservationId) {
            loadReservation();
        }
    }, [reservationId]);

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

    if (error || !reservation) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error ||
                            "Rezervacija nije pronađena."}
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

    const isCanceled =
        reservation.status.toLowerCase() ===
        "canceled";

    const clubAddress =
        formatAddress(club?.address);

    /*
     * Backend možda koristi name ili courtName,
     * pa pokrivamo obe mogućnosti.
     */
    const courtDisplayName =
        court?.name ||
        court?.courtName ||
        "Teren";

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                <Link
                    href="/player-dashboard/reservation"
                    className="text-sm font-semibold text-green-700 hover:underline"
                >
                    ← Nazad na moje rezervacije
                </Link>

                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                        Rezervacija
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-zinc-900">
                        Detalji rezervacije
                    </h1>

                    {/* KLUB I TEREN */}

                    <div className="mt-8 rounded-xl bg-zinc-50 p-6">
                        <h2 className="text-lg font-bold text-zinc-900">
                            Lokacija rezervacije
                        </h2>

                        <div className="mt-5 grid gap-6 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Teniski klub
                                </p>

                                <p className="mt-1 font-semibold text-zinc-900">
                                    {club?.name ||
                                        "Učitavanje kluba..."}
                                </p>

                                {clubAddress && (
                                    <p className="mt-1 text-sm text-zinc-500">
                                        📍 {clubAddress}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">
                                    Teren
                                </p>

                                <p className="mt-1 font-semibold text-zinc-900">
                                    {courtDisplayName}
                                </p>

                                {court?.surface && (
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Podloga:{" "}
                                        {court.surface}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DATUM, VREME, CENA, STATUS */}

                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-zinc-500">
                                Datum
                            </p>

                            <p className="mt-1 font-semibold text-zinc-900">
                                {formatDate(
                                    reservation.startTime
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500">
                                Vreme
                            </p>

                            <p className="mt-1 font-semibold text-zinc-900">
                                {formatTime(
                                    reservation.startTime
                                )}{" "}
                                -{" "}
                                {formatTime(
                                    reservation.endTime
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500">
                                Cena
                            </p>

                            <p className="mt-1 font-semibold text-zinc-900">
                                {
                                    reservation.price
                                        .amount
                                }{" "}
                                {
                                    reservation.price
                                        .currency
                                }
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500">
                                Status
                            </p>

                            <p
                                className={`mt-1 font-semibold ${
                                    isCanceled
                                        ? "text-red-600"
                                        : "text-green-700"
                                }`}
                            >
                                {reservation.status}
                            </p>
                        </div>
                    </div>

                    {!isCanceled && (
                        <div className="mt-10">
                            <Link
                                href={`/player-dashboard/reservation/${reservation.id}/edit`}
                                className="inline-block rounded-lg border border-green-700 px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                            >
                                Izmeni rezervaciju
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}