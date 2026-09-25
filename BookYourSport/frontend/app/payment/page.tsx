"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import PlayerHeader from "../player-dashboard/PlayerHeader";
import Footer from "../Footer";
import { isLoggedIn } from "@/lib/auth";
import { getBalance } from "@/lib/paymentApi";
import {
    getClub,
    createReservation,
    Club,
    Reservation,
} from "@/lib/reservationApi";

type SelectedSlot = {
    date: string;
    startTime: string;
    endTime: string;
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("sr-Latn-RS", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("sr-Latn-RS", {
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

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const clubId = searchParams.get("clubId") || "";
    const clubNameFromUrl = searchParams.get("clubName") || "";
    const courtId = searchParams.get("courtId") || "";
    const courtNameFromUrl = searchParams.get("courtName") || "";

    const [selectedSlots, setSelectedSlots] = useState<
        SelectedSlot[]
    >([]);

    const [club, setClub] = useState<Club | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState("RSD");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [insufficientCredit, setInsufficientCredit] =
        useState(false);

    const [confirmed, setConfirmed] = useState<Reservation[]>([]);

    /*
     * Parsiranje termina iz query stringa.
     * Ako parametri nedostaju ili su nevalidni,
     * korisnika vraćamo na izbor termina.
     */
    useEffect(() => {
        try {
            if (!isLoggedIn()) {
                router.replace("/login");
                return;
            }

            const rawReservations =
                searchParams.get("reservations");

            if (!clubId || !courtId || !rawReservations) {
                throw new Error(
                    "Nedostaju podaci o rezervaciji. Vrati se i izaberi termin ponovo."
                );
            }

            const parsed: SelectedSlot[] = JSON.parse(
                rawReservations
            );

            if (!Array.isArray(parsed) || parsed.length === 0) {
                throw new Error(
                    "Nisi izabrao/la nijedan termin."
                );
            }

            setSelectedSlots(parsed);
        } catch (parseError) {
            console.error(
                "Greška prilikom čitanja rezervacije iz URL-a:",
                parseError
            );

            setError(
                parseError instanceof Error
                    ? parseError.message
                    : "Podaci o rezervaciji nisu validni."
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * Učitavamo klub (radi cene po satu terena)
     * i trenutno stanje novčanika.
     */
    useEffect(() => {
        async function loadData() {
            if (!clubId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const [clubData, walletData] = await Promise.all([
                    getClub(clubId),
                    getBalance(),
                ]);

                setClub(clubData);
                setBalance(walletData.balance);
                setCurrency(walletData.currency || "RSD");
            } catch (loadError) {
                console.error(
                    "Greška prilikom učitavanja podataka za plaćanje:",
                    loadError
                );

                setError(
                    "Nije moguće učitati podatke potrebne za plaćanje."
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [clubId]);

    const selectedCourt = club?.courts?.find(
        (item) => item.id === courtId
    );

    const pricePerHour =
        selectedCourt?.pricePerHour?.amount ?? 0;

    const priceCurrency =
        selectedCourt?.pricePerHour?.currency || currency;

    function slotPrice(slot: SelectedSlot) {
        const durationHours =
            (new Date(slot.endTime).getTime() -
                new Date(slot.startTime).getTime()) /
            (1000 * 60 * 60);

        return Math.round(durationHours * pricePerHour);
    }

    const totalPrice = selectedSlots.reduce(
        (sum, slot) => sum + slotPrice(slot),
        0
    );

    const notEnoughFunds =
        balance !== null && balance < totalPrice;

    async function handleConfirm() {
        setSubmitting(true);
        setSubmitError("");
        setInsufficientCredit(false);

        const created: Reservation[] = [];

        try {
            for (const slot of selectedSlots) {
                const reservation = await createReservation(
                    clubId,
                    courtId,
                    slot.startTime,
                    slot.endTime
                );

                created.push(reservation);
            }

            setConfirmed(created);
        } catch (confirmError) {
            console.error(
                "Greška prilikom potvrde rezervacije:",
                confirmError
            );

            const message =
                confirmError instanceof Error
                    ? confirmError.message
                    : "Plaćanje nije uspelo. Pokušaj ponovo.";

            if (message.toLowerCase().includes("kredit")) {
                setInsufficientCredit(true);
            }

            setSubmitError(message);

            // Ako je nešto već uspešno kreirano pre greške,
            // to ostaje kao validna rezervacija.
            setConfirmed(created);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                    <p className="text-zinc-600">
                        Učitavanje podataka za plaćanje...
                    </p>
                </section>

                <Footer />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        {error}
                    </div>

                    <Link
                        href="/clubs"
                        className="mt-6 inline-block font-semibold text-green-700 hover:underline"
                    >
                        ← Pronađi teren
                    </Link>
                </section>

                <Footer />
            </main>
        );
    }

    /*
     * Rezervacija(e) uspešno kreirana(e) i naplaćena(e).
     */
    if (confirmed.length > 0 && !submitError) {
        return (
            <main className="flex min-h-screen flex-col bg-zinc-50">
                <PlayerHeader />

                <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
                        <p className="text-2xl font-bold text-green-800">
                            Rezervacija je potvrđena! 🎾
                        </p>

                        <p className="mt-2 text-green-700">
                            Uspešno je naplaćeno{" "}
                            {formatPrice(
                                confirmed.reduce(
                                    (sum, r) => sum + r.price.amount,
                                    0
                                ),
                                confirmed[0]?.price.currency ||
                                priceCurrency
                            )}{" "}
                            sa tvog novčanika.
                        </p>

                        <Link
                            href="/player-dashboard/reservation"
                            className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                        >
                            Idi na moje rezervacije
                        </Link>
                    </div>
                </section>

                <Footer />
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                    Plaćanje
                </p>

                <h1 className="mt-3 text-3xl font-bold text-zinc-900">
                    Pregled rezervacije
                </h1>

                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-zinc-900">
                        {club?.name || clubNameFromUrl}
                    </h2>

                    <p className="text-zinc-600">
                        {selectedCourt?.name || courtNameFromUrl}
                    </p>

                    <div className="mt-6 space-y-3">
                        {selectedSlots.map((slot) => (
                            <div
                                key={slot.date}
                                className="flex items-center justify-between rounded-xl bg-zinc-50 p-4"
                            >
                                <div>
                                    <p className="font-semibold capitalize text-zinc-900">
                                        {formatDate(
                                            slot.startTime
                                        )}
                                    </p>

                                    <p className="text-sm text-zinc-600">
                                        {formatTime(
                                            slot.startTime
                                        )}{" "}
                                        - {formatTime(slot.endTime)}
                                    </p>
                                </div>

                                <p className="font-semibold text-zinc-900">
                                    {formatPrice(
                                        slotPrice(slot),
                                        priceCurrency
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-6">
                        <p className="text-lg font-bold text-zinc-900">
                            Ukupno
                        </p>

                        <p className="text-lg font-bold text-zinc-900">
                            {formatPrice(totalPrice, priceCurrency)}
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
                    <p className="text-sm text-zinc-500">
                        Stanje na novčaniku
                    </p>

                    <p className="mt-1 text-xl font-bold text-zinc-900">
                        {balance !== null
                            ? formatPrice(balance, currency)
                            : "—"}
                    </p>

                    {notEnoughFunds && (
                        <p className="mt-3 text-sm font-semibold text-red-600">
                            Nemaš dovoljno sredstava za ovu
                            rezervaciju.{" "}
                            <Link
                                href="/player-dashboard/topup"
                                className="underline"
                            >
                                Dopuni novčanik
                            </Link>
                        </p>
                    )}
                </div>

                {submitError && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        <p>{submitError}</p>

                        {insufficientCredit && (
                            <Link
                                href="/player-dashboard/topup"
                                className="mt-2 inline-block font-semibold underline"
                            >
                                Dopuni novčanik →
                            </Link>
                        )}
                    </div>
                )}

                <div className="mt-8">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleConfirm}
                        className="rounded-xl bg-green-700 px-7 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? "Obrada plaćanja..."
                            : "Potvrdi i plati"}
                    </button>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export default function PaymentPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen flex-col bg-zinc-50">
                    <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                        <p className="text-zinc-600">
                            Učitavanje...
                        </p>
                    </section>
                </main>
            }
        >
            <PaymentPageContent />
        </Suspense>
    );
}
