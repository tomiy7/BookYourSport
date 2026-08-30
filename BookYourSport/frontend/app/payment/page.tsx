"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "../Header";
import Footer from "../Footer";
import { getAccessToken } from "@/lib/auth";
import { getBalance, topUp } from "@/lib/paymentApi";

type ReservationRequest = {
    date: string;
    startTime: string;
    endTime: string;
};

type Price = {
    amount?: number;
    currency?: string;
};

type ReservationResponse = {
    id?: string;
    startTime?: string;
    endTime?: string;
    price?: Price;
    status?: string;
};

function formatDate(dateString: string) {
    const dateObject = new Date(`${dateString}T12:00:00`);

    const weekday = new Intl.DateTimeFormat("sr-Latn-RS", {
        weekday: "long",
    }).format(dateObject);

    const date = new Intl.DateTimeFormat("sr-Latn-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(dateObject);

    return `${weekday}, ${date}.`;
}

function formatTime(dateTimeString: string) {
    return new Intl.DateTimeFormat("sr-Latn-RS", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Belgrade",
    }).format(new Date(dateTimeString));
}

function formatPrice(amount?: number, currency = "RSD") {
    if (amount === undefined || amount === null) {
        return null;
    }

    return new Intl.NumberFormat("sr-Latn-RS", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ==========================================
// TOP UP MODAL
// Prikazuje se kad naplata padne zbog
// nedovoljno kredita na računu.
// ==========================================

function TopUpModal({
                        onClose,
                        onSuccess,
                    }: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState("RSD");
    const [amount, setAmount] = useState("");
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            return;
        }

        getBalance(token)
            .then((wallet) => {
                setBalance(wallet.balance);
                setCurrency(wallet.currency);
            })
            .catch(() => setError("Nije moguće učitati trenutno stanje."))
            .finally(() => setLoadingBalance(false));
    }, []);

    async function handleTopUp() {
        const token = getAccessToken();

        if (!token) {
            return;
        }

        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount < 100) {
            setError("Unesi iznos od najmanje 100 RSD.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await topUp(numericAmount, token, currency);

            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Uplata nije uspela."
            );
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
                <h3 className="text-xl font-bold text-zinc-900">
                    Nemaš dovoljno kredita
                </h3>

                <p className="mt-2 text-sm text-zinc-600">
                    Dopuni stanje da bi mogao/la da završiš rezervaciju.
                    Nastavljamo tačno tamo gde smo stali.
                </p>

                <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs text-zinc-500">
                        Trenutno stanje
                    </p>

                    <p className="mt-1 text-2xl font-bold text-zinc-800">
                        {loadingBalance
                            ? "Učitavanje..."
                            : formatPrice(balance ?? 0, currency)}
                    </p>
                </div>

                <label
                    htmlFor="topup-amount"
                    className="mb-2 mt-5 block text-sm font-semibold text-zinc-700"
                >
                    Iznos dopune
                </label>

                <input
                    id="topup-amount"
                    type="number"
                    min="100"
                    placeholder="Unesi iznos"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />

                {error && (
                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                    >
                        Otkaži
                    </button>

                    <button
                        type="button"
                        onClick={handleTopUp}
                        disabled={submitting}
                        className="flex-1 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting
                            ? "Uplata u toku..."
                            : "Uplati i nastavi"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// PAYMENT PAGE
// ==========================================

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const clubId = searchParams.get("clubId") || "";
    const clubName = searchParams.get("clubName") || "";
    const courtId = searchParams.get("courtId") || "";
    const courtName = searchParams.get("courtName") || "";
    const reservationsParam = searchParams.get("reservations");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    const [createdReservations, setCreatedReservations] =
        useState<ReservationResponse[]>([]);

    let reservations: ReservationRequest[] = [];

    try {
        reservations = reservationsParam
            ? JSON.parse(reservationsParam)
            : [];

        if (!Array.isArray(reservations)) {
            reservations = [];
        }
    } catch {
        reservations = [];
    }

    const hasReservationData = Boolean(
        clubId && courtId && reservations.length > 0
    );

    const fallbackRoute = clubId
        ? `/clubs/${clubId}`
        : "/clubs";

    // Čišćenje starih development podataka.
    // Ne brišemo accessToken!
    useEffect(() => {
        const oldReservationKeys = [
            "reservationData",
            "selectedReservation",
            "reservation",
            "paymentData",
            "selectedSlots",
            "bookingData",
        ];

        oldReservationKeys.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }, []);

    // Ako nemamo podatke o rezervaciji,
    // vraćamo korisnika nazad.
    useEffect(() => {
        if (hasReservationData) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            router.replace(fallbackRoute);
        }, 1500);

        return () => window.clearTimeout(timeoutId);
    }, [hasReservationData, fallbackRoute, router]);

    // ==========================================
    // KREIRANJE REZERVACIJA
    //
    // Nastavlja tačno tamo gde je prošli pokušaj
    // stao (bitno za nastavak nakon top-up-a).
    // ==========================================

    async function createReservations() {
        if (!hasReservationData) {
            return;
        }

        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        const remaining = reservations.slice(
            createdReservations.length
        );

        if (remaining.length === 0) {
            return;
        }

        setLoading(true);
        setError("");

        for (const selectedReservation of remaining) {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/reservation/api/clubs/${clubId}/courts/${courtId}/reservations`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            startTime: selectedReservation.startTime,
                            endTime: selectedReservation.endTime,
                        }),
                    }
                );

                let data: ReservationResponse & {
                    message?: string;
                    error?: string;
                };

                try {
                    data = await response.json();
                } catch {
                    throw new Error(
                        "Server je vratio neispravan odgovor."
                    );
                }

                if (!response.ok) {
                    if (
                        data.error ===
                        "INSUFFICIENT_CREDIT"
                    ) {
                        setShowTopUpModal(true);
                        setLoading(false);
                        return;
                    }

                    throw new Error(
                        data.message ||
                        data.error ||
                        "Jedan od termina više nije dostupan."
                    );
                }

                setCreatedReservations((current) => [
                    ...current,
                    data,
                ]);
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Došlo je do greške prilikom kreiranja rezervacija."
                );

                setLoading(false);
                return;
            }
        }

        setLoading(false);
    }

    function goBack() {
        router.push(fallbackRoute);
    }

    const totalPrice =
        createdReservations.reduce<number>(
            (sum, createdReservation) =>
                sum +
                (createdReservation.price?.amount ?? 0),
            0
        );

    const currency =
        createdReservations.find(
            (createdReservation) =>
                createdReservation.price?.currency
        )?.price?.currency ?? "RSD";

    return (
        <main className="min-h-screen bg-zinc-50">
            <Header />

            <div className="mx-auto max-w-4xl px-6 py-16">
                <section className="text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                        Pregled rezervacije
                    </span>

                    <h1 className="mt-3 text-4xl font-bold text-zinc-900">
                        Tvoji termini
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-zinc-600">
                        Proveri sve izabrane termine pre potvrde.
                    </p>
                </section>

                {!hasReservationData && (
                    <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                        <h2 className="text-xl font-bold text-red-700">
                            Podaci o rezervaciji nisu pronađeni
                        </h2>

                        <p className="mt-3 text-red-600">
                            Podaci za rezervaciju nisu kompletni.
                            Vraćamo te nazad.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.replace(fallbackRoute)
                            }
                            className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                        >
                            Vrati se nazad
                        </button>
                    </div>
                )}

                {hasReservationData && (
                    <section className="mt-12 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <div className="border-b border-zinc-200 pb-6">
                            <p className="text-sm text-zinc-500">
                                Klub
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                                {clubName ||
                                    "Izabrani teniski klub"}
                            </h2>

                            <p className="mt-3 text-zinc-600">
                                {courtName ||
                                    "Izabrani teren"}
                            </p>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-zinc-900">
                                Izabrani termini
                            </h3>

                            <div className="mt-5 space-y-3">
                                {reservations.map(
                                    (
                                        selectedReservation,
                                        index
                                    ) => {
                                        const alreadyCreated =
                                            index <
                                            createdReservations.length;

                                        return (
                                            <div
                                                key={`${selectedReservation.date}-${selectedReservation.startTime}-${index}`}
                                                className={
                                                    alreadyCreated
                                                        ? "flex flex-col gap-2 rounded-2xl bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                                                        : "flex flex-col gap-2 rounded-2xl bg-zinc-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                                                }
                                            >
                                                <div>
                                                    <p className="font-bold capitalize text-zinc-900">
                                                        {formatDate(
                                                            selectedReservation.date
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-zinc-600">
                                                        {formatTime(
                                                            selectedReservation.startTime
                                                        )}
                                                        {" – "}
                                                        {formatTime(
                                                            selectedReservation.endTime
                                                        )}
                                                    </p>
                                                </div>

                                                <span
                                                    className={
                                                        alreadyCreated
                                                            ? "font-semibold text-green-700"
                                                            : "font-semibold text-zinc-500"
                                                    }
                                                >
                                                    {alreadyCreated
                                                        ? "✓ Potvrđeno"
                                                        : `Termin ${
                                                            index + 1
                                                        }`}
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                                {error}
                            </div>
                        )}

                        {createdReservations.length <
                            reservations.length && (
                                <div className="mt-8 border-t border-zinc-200 pt-8">
                                    <h3 className="text-lg font-bold text-zinc-900">
                                        Potvrda rezervacija
                                    </h3>

                                    <p className="mt-3 leading-7 text-zinc-600">
                                        Klikom na dugme prelaziš na
                                        plaćanje. Svaki termin se naplaćuje
                                        sa tvog kredita i kreira kao
                                        posebna rezervacija.
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-4">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            disabled={loading}
                                            className="rounded-xl border border-zinc-300 bg-white px-7 py-4 font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                                        >
                                            Izmeni termine
                                        </button>

                                        <button
                                            type="button"
                                            onClick={createReservations}
                                            disabled={loading}
                                            className="rounded-xl bg-green-700 px-7 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Obrađujemo plaćanje..."
                                                : "Nastavi na plaćanje →"}
                                        </button>
                                    </div>
                                </div>
                            )}

                        {createdReservations.length > 0 &&
                            createdReservations.length ===
                            reservations.length && (
                                <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
                                    <h3 className="text-xl font-bold text-green-900">
                                        ✓ Rezervacije su uspešno
                                        kreirane
                                    </h3>

                                    <p className="mt-3 text-green-800">
                                        Uspešno je kreirano{" "}
                                        {createdReservations.length}{" "}
                                        {createdReservations.length ===
                                        1
                                            ? "rezervacija"
                                            : "rezervacije"}.
                                    </p>

                                    {totalPrice > 0 && (
                                        <div className="mt-6 border-t border-green-200 pt-5">
                                            <p className="text-sm font-semibold uppercase tracking-wider text-green-800">
                                                Ukupna cena
                                            </p>

                                            <p className="mt-2 text-3xl font-bold text-zinc-900">
                                                {formatPrice(
                                                    totalPrice,
                                                    currency
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.replace("/")
                                        }
                                        className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                                    >
                                        Nazad na početnu
                                    </button>
                                </div>
                            )}
                    </section>
                )}
            </div>

            {showTopUpModal && (
                <TopUpModal
                    onClose={() =>
                        setShowTopUpModal(false)
                    }
                    onSuccess={() => {
                        setShowTopUpModal(false);
                        createReservations();
                    }}
                />
            )}

            <Footer />
        </main>
    );
}