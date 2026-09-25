"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUser } from "@/lib/user";
import {
    getMyReservations,
    getClub,
    type Club,
    type Reservation,
} from "@/lib/reservationApi";
import { getCancellationMessage } from "@/lib/cancellation";

type NoticeItem = Reservation & {
    clubName?: string;
    courtName?: string;
};

// Pamti koje otkazane rezervacije je igrač već video,
// da se popup ne prikazuje ponovo.
function seenKey(userId: string) {
    return `cancelledReservationsSeen:${userId}`;
}

function readSeen(userId: string): string[] {
    try {
        const raw = localStorage.getItem(seenKey(userId));
        const parsed = raw ? JSON.parse(raw) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveSeen(userId: string, ids: string[]) {
    try {
        localStorage.setItem(seenKey(userId), JSON.stringify(ids));
    } catch {
        // Ako localStorage nije dostupan, popup će se samo prikazati ponovo.
    }
}

function formatDateTime(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);

    const date = start.toLocaleDateString("sr-Latn-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const time = (value: Date) =>
        value.toLocaleTimeString("sr-Latn-RS", {
            hour: "2-digit",
            minute: "2-digit",
        });

    return `${date} · ${time(start)} - ${time(end)}`;
}

function formatPrice(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat("sr-Latn-RS", {
            style: "currency",
            currency,
        }).format(amount);
    } catch {
        return `${amount} ${currency}`;
    }
}

export default function CancelledReservationsNotice() {
    const [userId, setUserId] = useState<string | null>(null);
    const [items, setItems] = useState<NoticeItem[]>([]);

    useEffect(() => {
        const user = getStoredUser();

        if (!user?.id) {
            return;
        }

        const currentUserId = user.id;
        let isCancelled = false;

        async function load() {
            try {
                const reservations = await getMyReservations(currentUserId);
                const seen = new Set(readSeen(currentUserId));

                const unseen = reservations.filter(
                    (reservation) =>
                        reservation.status.toLowerCase() === "cancelled" &&
                        getCancellationMessage(reservation.cancellationReason) !== null &&
                        !seen.has(reservation.id)
                );

                if (unseen.length === 0) {
                    return;
                }

                // Dodajemo nazive kluba i terena da poruka bude razumljiva.
                const clubIds = Array.from(
                    new Set(unseen.map((reservation) => reservation.clubId))
                );

                const clubsById = new Map<string, Club>();

                await Promise.all(
                    clubIds.map(async (clubId) => {
                        try {
                            clubsById.set(clubId, await getClub(clubId));
                        } catch {
                            // Bez naziva kluba, popup i dalje radi.
                        }
                    })
                );

                const enriched = unseen.map((reservation) => {
                    const club = clubsById.get(reservation.clubId);
                    const court = club?.courts?.find(
                        (item) => item.id === reservation.courtId
                    );

                    return {
                        ...reservation,
                        clubName: club?.name,
                        courtName: court?.name,
                    };
                });

                if (!isCancelled) {
                    setUserId(currentUserId);
                    setItems(enriched);
                }
            } catch {
                // Obaveštenje nije kritično, pa greška ne sme da pokvari stranicu.
            }
        }

        load();

        return () => {
            isCancelled = true;
        };
    }, []);

    function markAsSeen() {
        if (userId) {
            saveSeen(userId, [
                ...readSeen(userId),
                ...items.map((item) => item.id),
            ]);
        }

        setItems([]);
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-3xl font-bold text-amber-700">!</span>
                </div>

                <h2 className="mt-6 text-center text-2xl font-bold text-zinc-900">
                    {items.length === 1
                        ? "Klub je otkazao tvoju rezervaciju"
                        : "Klub je otkazao neke tvoje rezervacije"}
                </h2>

                <p className="mt-3 text-center leading-6 text-zinc-600">
                    Teren više nije dostupan, pa je termin otkazan. Za svaku
                    rezervaciju ti je u celosti vraćen novac na račun.
                </p>

                <ul className="mt-6 max-h-60 space-y-3 overflow-y-auto">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                        >
                            <p className="font-semibold text-zinc-900">
                                {item.clubName || "Klub"}
                                {item.courtName ? ` · ${item.courtName}` : ""}
                            </p>

                            <p className="mt-1 text-sm text-zinc-600">
                                {formatDateTime(item.startTime, item.endTime)}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-green-700">
                                Vraćeno: {formatPrice(item.price.amount, item.price.currency)}
                            </p>
                        </li>
                    ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/player-dashboard/reservation?view=history"
                        onClick={markAsSeen}
                        className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 text-center font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                        Pogledaj rezervacije
                    </Link>

                    <button
                        type="button"
                        onClick={markAsSeen}
                        className="flex-1 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
                    >
                        Razumem
                    </button>
                </div>
            </div>
        </div>
    );
}
