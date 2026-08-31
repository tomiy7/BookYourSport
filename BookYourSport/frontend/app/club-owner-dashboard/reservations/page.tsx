"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "../ClubOwnerHeader";
import { getStoredUser } from "@/lib/user";
import { getAccessToken } from "@/lib/auth";
import {
    getClubs,
    getClubReservations,
    cancelReservation,
    type Club,
    type Reservation,
} from "@/lib/reservationApi";

function toDateKey(iso: string) {
    return iso.slice(0, 10);
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function formatDayLabel(date: Date) {
    return date.toLocaleDateString("sr-RS", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
    });
}

const STATUS_LABELS: Record<string, string> = {
    Pending: "Na čekanju",
    Confirmed: "Potvrđena",
    Cancelled: "Otkazana",
};

const STATUS_STYLES: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Confirmed: "bg-green-100 text-green-800",
    Cancelled: "bg-zinc-100 text-zinc-500",
};

export default function ClubReservationsPage() {
    const router = useRouter();

    const [club, setClub] = useState<Club | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedCourtId, setSelectedCourtId] = useState<string>("all");
    const [dayOffset, setDayOffset] = useState(0);
    const [selectedReservation, setSelectedReservation] =
        useState<Reservation | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const selectedDate = useMemo(
        () => addDays(new Date(), dayOffset),
        [dayOffset]
    );

    const selectedDateKey = useMemo(
        () => toDateKey(selectedDate.toISOString()),
        [selectedDate]
    );

    function loadData(clubId: string, token: string) {
        getClubReservations(clubId, token)
            .then(setReservations)
            .catch(() =>
                setError("Nije moguće učitati rezervacije.")
            )
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        const token = getAccessToken();
        const user = getStoredUser();

        if (!token || !user) {
            router.push("/login");
            return;
        }

        getClubs()
            .then((clubs) => {
                const ownClub = clubs.find(
                    (c) => c.ownerId === user.id
                );

                if (!ownClub) {
                    setLoading(false);
                    return;
                }

                setClub(ownClub);
                loadData(ownClub.id, token);
            })
            .catch(() => {
                setError("Nije moguće učitati podatke o klubu.");
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const reservationsForDay = useMemo(() => {
        return reservations
            .filter((r) => toDateKey(r.startTime) === selectedDateKey)
            .filter(
                (r) =>
                    selectedCourtId === "all" ||
                    r.courtId === selectedCourtId
            )
            .filter((r) => r.status !== "Cancelled")
            .sort(
                (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
            );
    }, [reservations, selectedDateKey, selectedCourtId]);

    async function handleCancel(reservationId: string) {
        const token = getAccessToken();
        if (!token || !club) return;

        setCancelling(true);

        try {
            await cancelReservation(reservationId, token);
            setSelectedReservation(null);
            loadData(club.id, token);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Otkazivanje rezervacije nije uspelo."
            );
        } finally {
            setCancelling(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
                <p className="text-zinc-500">Učitavanje...</p>
            </main>
        );
    }

    if (!club) {
        return (
            <main className="min-h-screen bg-[#f7f8f7]">
                <ClubOwnerHeader />
                <section className="mx-auto w-full max-w-2xl px-6 py-12 text-center">
                    <p className="text-zinc-600">
                        Prvo napravi klub da bi video rezervacije.
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <ClubOwnerHeader />

            <section className="mx-auto w-full max-w-4xl px-6 py-10">
                <div className="mb-8">
                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        {club.name.toUpperCase()}
                    </span>

                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        Rezervacije
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Pregled zauzetih termina po danu i terenu.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* IZBOR DANA */}
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const date = addDays(new Date(), i);
                        const isSelected = i === dayOffset;

                        return (
                            <button
                                key={i}
                                onClick={() => setDayOffset(i)}
                                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                    isSelected
                                        ? "border-green-700 bg-green-700 text-white"
                                        : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                                }`}
                            >
                                {i === 0 ? "Danas" : formatDayLabel(date)}
                            </button>
                        );
                    })}
                </div>

                {/* IZBOR TERENA */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCourtId("all")}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                            selectedCourtId === "all"
                                ? "border-green-700 bg-green-50 text-green-800"
                                : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                        }`}
                    >
                        Svi tereni
                    </button>

                    {club.courts.map((court) => (
                        <button
                            key={court.id}
                            onClick={() => setSelectedCourtId(court.id)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                                selectedCourtId === court.id
                                    ? "border-green-700 bg-green-50 text-green-800"
                                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                            }`}
                        >
                            {court.name}
                        </button>
                    ))}
                </div>

                {/* LISTA REZERVACIJA ZA DAN */}
                {reservationsForDay.length === 0 ? (
                    <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
                        Nema rezervacija za izabrani dan.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reservationsForDay.map((reservation) => {
                            const court = club.courts.find(
                                (c) => c.id === reservation.courtId
                            );

                            return (
                                <button
                                    key={reservation.id}
                                    onClick={() =>
                                        setSelectedReservation(reservation)
                                    }
                                    className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-4 text-left transition hover:border-green-300 hover:shadow-md"
                                >
                                    <div>
                                        <p className="font-semibold text-zinc-800">
                                            {court?.name ?? "Nepoznat teren"}
                                        </p>

                                        <p className="mt-1 text-sm text-zinc-500">
                                            {formatTime(reservation.startTime)} –{" "}
                                            {formatTime(reservation.endTime)}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            STATUS_STYLES[reservation.status] ??
                                            "bg-zinc-100 text-zinc-500"
                                        }`}
                                    >
                                        {STATUS_LABELS[reservation.status] ??
                                            reservation.status}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* DETALJI REZERVACIJE */}
                {selectedReservation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-zinc-800">
                                Detalji rezervacije
                            </h2>

                            <div className="mt-6 space-y-4">
                                <DetailRow
                                    label="Teren"
                                    value={
                                        club.courts.find(
                                            (c) =>
                                                c.id ===
                                                selectedReservation.courtId
                                        )?.name ?? "-"
                                    }
                                />

                                <DetailRow
                                    label="Termin"
                                    value={`${formatTime(
                                        selectedReservation.startTime
                                    )} – ${formatTime(
                                        selectedReservation.endTime
                                    )}`}
                                />

                                <DetailRow
                                    label="Trajanje"
                                    value={`${Math.round(
                                        (new Date(
                                                selectedReservation.endTime
                                            ).getTime() -
                                            new Date(
                                                selectedReservation.startTime
                                            ).getTime()) /
                                        3600000
                                    )} h`}
                                />

                                <DetailRow
                                    label="Cena"
                                    value={`${selectedReservation.price.amount} ${selectedReservation.price.currency}`}
                                />

                                <DetailRow
                                    label="Status"
                                    value={
                                        STATUS_LABELS[
                                            selectedReservation.status
                                            ] ?? selectedReservation.status
                                    }
                                />

                                <DetailRow
                                    label="ID korisnika"
                                    value={selectedReservation.userId}
                                />
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setSelectedReservation(null)}
                                    className="flex-1 rounded-lg border border-zinc-300 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                                >
                                    Zatvori
                                </button>

                                {selectedReservation.status !== "Cancelled" && (
                                    <button
                                        onClick={() =>
                                            handleCancel(selectedReservation.id)
                                        }
                                        disabled={cancelling}
                                        className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {cancelling
                                            ? "Otkazivanje..."
                                            : "Otkaži rezervaciju"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <span className="text-sm text-zinc-500">{label}</span>
            <span className="text-sm font-semibold text-zinc-800">
                {value}
            </span>
        </div>
    );
}
