"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "./ClubOwnerHeader";
import { getStoredUser } from "@/lib/user";
import { getAccessToken } from "@/lib/auth";
import { getClubs, type Club } from "@/lib/reservationApi";

export default function ClubOwnerDashboard() {
    const router = useRouter();

    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = getAccessToken();
        const user = getStoredUser();

        if (!token || !user) {
            router.push("/login");
            return;
        }

        if (user.role !== "club") {
            // Nije club owner - ne treba da bude ovde.
            router.push("/player-dashboard");
            return;
        }

        getClubs()
            .then((clubs) => {
                const ownClub = clubs.find(
                    (c) => c.ownerId === user.id
                );

                setClub(ownClub ?? null);
            })
            .catch(() => {
                setError(
                    "Nije moguće učitati podatke o klubu."
                );
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
                <p className="text-zinc-500">Učitavanje...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <ClubOwnerHeader />

            <section className="mx-auto w-full max-w-6xl px-6 py-10">

                <div className="mb-9">
                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        MOJ KLUB
                    </span>

                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        {club ? club.name : "Pregled kluba"}
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Upravljaj svojim terenima, prati rezervacije
                        i menjaj podatke o klubu na jednom mestu.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!club && !error && (
                    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
                        <h2 className="text-xl font-semibold text-zinc-800">
                            Još uvek nemaš klub
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Napravi svoj klub da bi mogao da dodaš
                            terene i primaš rezervacije.
                        </p>

                        <button
                            onClick={() =>
                                router.push(
                                    "/club-owner-dashboard/create-club"
                                )
                            }
                            className="mt-6 rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                        >
                            Napravi klub
                        </button>
                    </div>
                )}

                {club && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                        <section
                            onClick={() =>
                                router.push(
                                    "/club-owner-dashboard/reservations"
                                )
                            }
                            className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                        >
                            <div className="border-b border-zinc-200 px-6 py-5">
                                <h2 className="text-xl font-semibold text-zinc-800">
                                    Rezervacije
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Pregled zauzetih termina na
                                    tvojim terenima, danas i unapred.
                                </p>
                            </div>

                            <div className="px-6 py-6">
                                <span className="text-sm font-semibold text-green-800">
                                    Pogledaj kalendar rezervacija
                                </span>
                            </div>
                        </section>

                        <section
                            onClick={() =>
                                router.push(
                                    "/club-owner-dashboard/courts"
                                )
                            }
                            className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                        >
                            <div className="border-b border-zinc-200 px-6 py-5">
                                <h2 className="text-xl font-semibold text-zinc-800">
                                    Tereni
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {club.courts.length} teren(a) u
                                    tvom klubu.
                                </p>
                            </div>

                            <div className="px-6 py-6">
                                <span className="text-sm font-semibold text-green-800">
                                    Upravljaj terenima
                                </span>
                            </div>
                        </section>

                        <section
                            onClick={() =>
                                router.push(
                                    "/club-owner-dashboard/edit-club"
                                )
                            }
                            className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white px-6 py-5 transition hover:border-green-300 hover:shadow-md lg:col-span-2"
                        >
                            <h2 className="text-xl font-semibold text-zinc-800">
                                Podaci o klubu
                            </h2>

                            <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                        Grad
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800">
                                        {club.address.city}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                        Adresa
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800">
                                        {club.address.street} {club.address.streetNumber}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                        Status
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-zinc-800">
                                        {club.isActive ? "Aktivan" : "Neaktivan"}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-5 text-sm font-semibold text-green-800">
                                Izmeni podatke o klubu
                            </p>
                        </section>

                    </div>
                )}

            </section>
        </main>
    );
}
