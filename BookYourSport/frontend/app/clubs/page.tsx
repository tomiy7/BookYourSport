"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "../Header";
import Footer from "../Footer";

type SearchCourt = {
    id: string;
    name: string;
    surfaceType: number | string;
    isIndoor: boolean;
    pricePerHour: number;
    currency: string;
};

type SearchClub = {
    id: string;
    name: string;
    city: string;
    street: string;
    streetNumber: string;
    isActive: boolean;
    courts: SearchCourt[];
    distanceKm?: number | null;
    latitude?: number | null;
    longitude?: number | null;
};

type SearchResult = {
    clubs: SearchClub[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
};

function formatAddress(club: SearchClub) {
    const streetPart = [club.street, club.streetNumber]
        .filter(Boolean)
        .join(" ");

    return [streetPart, club.city]
        .filter(Boolean)
        .join(", ");
}

function formatStartingPrice(club: SearchClub) {
    if (!club.courts.length) {
        return null;
    }

    const cheapestCourt = club.courts.reduce(
        (cheapest, court) =>
            court.pricePerHour < cheapest.pricePerHour
                ? court
                : cheapest
    );

    return `od ${cheapestCourt.pricePerHour} ${cheapestCourt.currency}/h`;
}

function ClubsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const urlQuery = searchParams.get("query") || "";

    const [searchInput, setSearchInput] =
        useState(urlQuery);

    const [clubs, setClubs] = useState<SearchClub[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // UČITAJ KLUBOVE SA SEARCH API-JA
    //
    // Ovo se ponovo pokreće svaki put kad se
    // "query" u URL-u promeni (npr. kad korisnik
    // pretraži ili kad refreshuje stranicu sa
    // /clubs?query=... u adresi).
    // ==========================================

    useEffect(() => {
        async function loadClubs() {
            try {
                setLoading(true);
                setError("");

                const params = new URLSearchParams();

                if (urlQuery) {
                    params.set("query", urlQuery);
                }

                params.set("page", "1");
                params.set("pageSize", "20");

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/search/api/search/clubs?${params.toString()}`
                );

                if (!response.ok) {
                    throw new Error("Klubovi nisu dostupni.");
                }

                const data: SearchResult =
                    await response.json();

                setClubs(data.clubs);
                setTotalCount(data.totalCount);
            } catch (err) {
                console.error(err);

                setError(
                    "Nije moguće učitati teniske klubove."
                );
            } finally {
                setLoading(false);
            }
        }

        loadClubs();
    }, [urlQuery]);

    // ==========================================
    // SEARCH FORM
    //
    // Submit menja "query" u URL-u, što onda
    // pokreće useEffect iznad. URL ostaje source
    // of truth (deljivo, radi na refresh).
    // ==========================================

    function handleSearchSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const trimmedQuery = searchInput.trim();

        if (trimmedQuery) {
            router.push(
                `/clubs?query=${encodeURIComponent(
                    trimmedQuery
                )}`
            );
        } else {
            router.push("/clubs");
        }
    }

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
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex gap-3"
                    >
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) =>
                                setSearchInput(
                                    e.target.value
                                )
                            }
                            placeholder="Pretraži po nazivu kluba, gradu ili lokaciji..."
                            className="w-full rounded-xl border border-zinc-300 bg-white px-5 py-4 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                        />

                        <button
                            type="submit"
                            className="shrink-0 rounded-xl bg-green-700 px-6 py-4 text-sm font-semibold text-white transition hover:bg-green-800"
                        >
                            Pretraži
                        </button>
                    </form>

                    {urlQuery && (
                        <p className="mt-3 text-sm text-zinc-500">
                            Rezultati pretrage za:{" "}
                            <span className="font-semibold text-zinc-700">
                                {urlQuery}
                            </span>
                        </p>
                    )}
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
                    totalCount === 0 && (
                        <div className="py-20 text-center text-zinc-500">
                            Nema klubova koji odgovaraju
                            tvojoj pretrazi.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    clubs.length > 0 && (
                        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {clubs.map((club) => {
                                const address =
                                    formatAddress(club);

                                const startingPrice =
                                    formatStartingPrice(
                                        club
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

                                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                                            {club.courts.length}{" "}
                                            teren
                                            {club.courts
                                                .length === 1
                                                ? ""
                                                : "a"}
                                            {startingPrice &&
                                                ` · ${startingPrice}`}
                                        </p>

                                        <div className="mt-auto pt-6 font-semibold text-green-700">
                                            Pogledaj klub →
                                        </div>
                                    </Link>
                                );
                            })}
                        </section>
                    )}
            </div>

            <Footer />
        </main>
    );
}

// ==========================================
// CLUBS PAGE
// Suspense je potreban zbog useSearchParams()
// u Next.js production buildu.
// ==========================================

export default function ClubsPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-zinc-50">
                    <div className="flex min-h-screen items-center justify-center">
                        Učitavanje...
                    </div>
                </main>
            }
        >
            <ClubsPageContent />
        </Suspense>
    );
}
