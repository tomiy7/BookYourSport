"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";

type Address = {
    city?: string;
    municipality?: string;
    zipCode?: string;
    street?: string;
    country?: string;
    streetNumber?: string;
};

type Club = {
    id: string;
    name: string;
    address?: Address | string;
    description?: string;
};

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

export default function ClubsPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadClubs() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs`
                );

                if (!response.ok) {
                    throw new Error("Klubovi nisu dostupni.");
                }

                const data = await response.json();

                setClubs(data);
            } catch (error) {
                console.error(error);

                setError(
                    "Nije moguće učitati teniske klubove."
                );
            } finally {
                setLoading(false);
            }
        }

        loadClubs();
    }, []);

    const filteredClubs = clubs.filter((club) => {
        const searchText = search
            .toLowerCase()
            .trim();

        if (!searchText) {
            return true;
        }

        const addressText = formatAddress(
            club.address
        ).toLowerCase();

        return (
            club.name
                .toLowerCase()
                .includes(searchText) ||
            addressText.includes(searchText)
        );
    });

    return (
        <main className="min-h-screen bg-zinc-50">
            <Header />

            <div className="mx-auto max-w-6xl px-6 py-12">
                <section className="text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                        Pronađi klub
                    </span>

                    <h1 className="mt-3 text-4xl font-bold text-zinc-900">
                        Pronađi idealan teniski klub
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
                        Pretraži teniske klubove, izaberi
                        teren i pogledaj slobodne termine.
                    </p>
                </section>

                <section className="mx-auto mt-10 max-w-2xl">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Pretraži po nazivu kluba, gradu ili lokaciji..."
                        className="w-full rounded-xl border border-zinc-300 bg-white px-5 py-4 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                </section>

                {loading && (
                    <div className="py-20 text-center text-zinc-500">
                        Učitavanje klubova...
                    </div>
                )}

                {error && (
                    <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredClubs.length === 0 && (
                        <div className="py-20 text-center text-zinc-500">
                            Nema klubova koji odgovaraju
                            tvojoj pretrazi.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredClubs.length > 0 && (
                        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredClubs.map(
                                (club) => {
                                    const address =
                                        formatAddress(
                                            club.address
                                        );

                                    return (
                                        <Link
                                            key={club.id}
                                            href={`/clubs/${club.id}`}
                                            className="group flex min-h-64 flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
                                        >
                                            <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                                                Teniski klub
                                            </span>

                                            <h2 className="mt-3 text-xl font-bold text-zinc-900 transition group-hover:text-green-700">
                                                {club.name}
                                            </h2>

                                            {address && (
                                                <p className="mt-4 text-sm leading-6 text-zinc-500">
                                                    📍 {address}
                                                </p>
                                            )}

                                            {club.description && (
                                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">
                                                    {club.description}
                                                </p>
                                            )}

                                            <div className="mt-auto pt-6 font-semibold text-green-700">
                                                Pogledaj klub →
                                            </div>
                                        </Link>
                                    );
                                }
                            )}
                        </section>
                    )}
            </div>

            <Footer />
        </main>
    );
}