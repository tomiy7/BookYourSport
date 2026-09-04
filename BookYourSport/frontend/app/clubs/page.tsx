
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
    const sortByParams = searchParams.getAll("sortBy");
    const urlSortBy =
        sortByParams.length > 0
            ? sortByParams
            : [];

    const urlSurfaceTypes =
        searchParams.getAll("surfaceType");
    const urlSortKey = urlSortBy.join("|");
    const urlSurfaceKey =
        urlSurfaceTypes.join("|");
    const urlMinPrice =
        searchParams.get("minPrice") || "";
    const urlMaxPrice =
        searchParams.get("maxPrice") || "";

    const [searchInput, setSearchInput] =
        useState(urlQuery);

    const [clubs, setClubs] = useState<SearchClub[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filtersOpen, setFiltersOpen] =
        useState(false);

    const [draftSurfaceTypes, setDraftSurfaceTypes] =
        useState<string[]>(urlSurfaceTypes);

    const [draftMinPrice, setDraftMinPrice] =
        useState(urlMinPrice);

    const [draftMaxPrice, setDraftMaxPrice] =
        useState(urlMaxPrice);

    const [sortOpen, setSortOpen] =
        useState(false);

    const sortRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDraftSurfaceTypes(urlSurfaceTypes);
        setDraftMinPrice(urlMinPrice);
        setDraftMaxPrice(urlMaxPrice);
    }, [urlSurfaceKey, urlMinPrice, urlMaxPrice]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (
                sortRef.current &&
                !sortRef.current.contains(event.target as Node)
            ) {
                setSortOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

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

                urlSortBy.forEach((sort) =>
                    params.append("sortBy", sort)
                );

                urlSurfaceTypes.forEach((surface) =>
                    params.append("surfaceType", surface)
                );

                if (urlMinPrice) {
                    params.set("minPrice", urlMinPrice);
                }

                if (urlMaxPrice) {
                    params.set("maxPrice", urlMaxPrice);
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
    }, [urlQuery, urlSortKey, urlSurfaceKey, urlMinPrice, urlMaxPrice]);

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
        const params = new URLSearchParams();

        if (trimmedQuery) {
            params.set("query", trimmedQuery);
        }

        urlSortBy.forEach((sort) =>
            params.append("sortBy", sort)
        );

        urlSurfaceTypes.forEach((surface) =>
            params.append("surfaceType", surface)
        );

        if (urlMinPrice) {
            params.set("minPrice", urlMinPrice);
        }

        if (urlMaxPrice) {
            params.set("maxPrice", urlMaxPrice);
        }

        const queryString = params.toString();

        router.push(
            queryString
                ? `/clubs?${queryString}`
                : "/clubs"
        );
    }

    function updateFilters(
        nextSortBy: string[],
        nextSurfaceTypes: string[],
        nextMinPrice: string,
        nextMaxPrice: string
    ) {
        const params = new URLSearchParams();

        if (urlQuery) {
            params.set("query", urlQuery);
        }

        nextSortBy.forEach((sort) =>
            params.append("sortBy", sort)
        );

        nextSurfaceTypes.forEach((surface) =>
            params.append("surfaceType", surface)
        );

        if (nextMinPrice) {
            params.set("minPrice", nextMinPrice);
        }

        if (nextMaxPrice) {
            params.set("maxPrice", nextMaxPrice);
        }

        const queryString = params.toString();

        router.push(
            queryString
                ? `/clubs?${queryString}`
                : "/clubs"
        );
    }

    function applyFilters() {
        updateFilters(
            urlSortBy,
            draftSurfaceTypes,
            draftMinPrice,
            draftMaxPrice
        );

        setFiltersOpen(false);
    }

    const activeFilterCount =
        urlSurfaceTypes.length +
        (urlMinPrice ? 1 : 0) +
        (urlMaxPrice ? 1 : 0);

    function clearFilters() {
        setDraftSurfaceTypes([]);
        setDraftMinPrice("");
        setDraftMaxPrice("");

        updateFilters(
            urlSortBy,
            [],
            "",
            ""
        );
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

                    <div className="mt-4 flex items-center justify-between border-y border-zinc-200 py-4">
                        <button
                            type="button"
                            onClick={() =>
                                setFiltersOpen(
                                    !filtersOpen
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-green-600 hover:text-green-700"
                        >
                            <span className="text-base">
                                ☰
                            </span>
                            Filteri
                            {activeFilterCount > 0 && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-xs font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <div
                            ref={sortRef}
                            className="relative"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setSortOpen((open) => !open)
                                }
                                className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-700 transition hover:border-green-600"
                            >
                                <span>Sortiraj</span>
                                <span className="text-zinc-400">▾</span>
                            </button>

                            {sortOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 shadow-lg">
                                    {[
                                        ["name", "Ime"],
                                        ["city", "Grad"],
                                        ["address", "Adresa"],
                                        ["price", "Cena"],
                                    ].map(
                                        ([field, label]) => {
                                            const currentSort =
                                                urlSortBy.find(
                                                    (sort) =>
                                                        sort.split("_")[0] ===
                                                        field
                                                );

                                            const currentDirection =
                                                currentSort?.split("_")[1] ??
                                                null;

                                            const toggleDirection = (
                                                direction: "asc" | "desc"
                                            ) => {
                                                const withoutCurrent =
                                                    urlSortBy.filter(
                                                        (sort) =>
                                                            sort.split("_")[0] !==
                                                            field
                                                    );

                                                const next =
                                                    currentDirection ===
                                                    direction
                                                        ? withoutCurrent
                                                        : [
                                                            ...withoutCurrent,
                                                            `${field}_${direction}`,
                                                        ];

                                                updateFilters(
                                                    next,
                                                    urlSurfaceTypes,
                                                    urlMinPrice,
                                                    urlMaxPrice
                                                );
                                            };

                                            return (
                                                <div
                                                    key={field}
                                                    className="grid grid-cols-[64px_24px_24px] items-center justify-center gap-1 py-1"
                                                >
                                                    <span className="w-auto text-sm font-medium text-zinc-800">
                                                        {label}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        title={
                                                            field === "price"
                                                                ? "Najniža cena"
                                                                : "A–Z"
                                                        }
                                                        aria-label={
                                                            field === "price"
                                                                ? "Najniža cena"
                                                                : "A–Z"
                                                        }
                                                        onClick={() => {
                                                            toggleDirection("asc");
                                                            setSortOpen(false);
                                                        }}
                                                        className={`flex h-7 w-6 items-center justify-center rounded-md text-lg leading-none ${
                                                            currentDirection ===
                                                            "asc"
                                                                ? "font-bold text-green-700"
                                                                : "text-zinc-400 hover:text-zinc-800"
                                                        }`}
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title={
                                                            field === "price"
                                                                ? "Najviša cena"
                                                                : "Z–A"
                                                        }
                                                        aria-label={
                                                            field === "price"
                                                                ? "Najviša cena"
                                                                : "Z–A"
                                                        }
                                                        onClick={() => {
                                                            toggleDirection("desc");
                                                            setSortOpen(false);
                                                        }}
                                                        className={`flex h-7 w-6 items-center justify-center rounded-md text-lg leading-none ${
                                                            currentDirection ===
                                                            "desc"
                                                                ? "font-bold text-green-700"
                                                                : "text-zinc-400 hover:text-zinc-800"
                                                        }`}
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">
                                        Filteri
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Pronađi teren koji ti najviše odgovara.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFiltersOpen(
                                            false
                                        )
                                    }
                                    className="text-xl text-zinc-400 hover:text-zinc-700"
                                    aria-label="Zatvori filtere"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-800">
                                        Podloga
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {[
                                            [
                                                "Hard",
                                                "Beton",
                                            ],
                                            [
                                                "Clay",
                                                "Šljaka",
                                            ],
                                            [
                                                "Grass",
                                                "Trava",
                                            ],
                                            [
                                                "Carpet",
                                                "Tepih",
                                            ],
                                        ].map(
                                            ([
                                                 value,
                                                 label,
                                             ]) => (
                                                <label
                                                    key={
                                                        value
                                                    }
                                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700 transition hover:border-green-400"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={draftSurfaceTypes.includes(
                                                            value
                                                        )}
                                                        onChange={(
                                                            e
                                                        ) => {
                                                            setDraftSurfaceTypes((current) =>
                                                                e.target.checked
                                                                    ? [...current, value]
                                                                    : current.filter(
                                                                        (surface) =>
                                                                            surface !== value
                                                                    )
                                                            );
                                                        }}
                                                        className="h-4 w-4 rounded border-zinc-300 text-green-700 focus:ring-green-600"
                                                    />
                                                    {
                                                        label
                                                    }
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-zinc-800">
                                        Cena po satu
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs text-zinc-500">
                                                Od
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                placeholder="npr. 1000"
                                                value={draftMinPrice}
                                                onChange={(e) =>
                                                    setDraftMinPrice(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs text-zinc-500">
                                                Do
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                placeholder="npr. 2000"
                                                value={draftMaxPrice}
                                                onChange={(e) =>
                                                    setDraftMaxPrice(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:border-zinc-400"
                                >
                                    Obriši filtere
                                </button>

                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                                >
                                    Primeni
                                </button>
                            </div>
                        </div>
                    )}

                    {activeFilterCount > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-sm text-zinc-500">
                                Aktivni filteri:
                            </span>

                            {urlSurfaceTypes.map(
                                (surface) => (
                                    <button
                                        key={surface}
                                        type="button"
                                        onClick={() =>
                                            updateFilters(
                                                urlSortBy,
                                                urlSurfaceTypes.filter(
                                                    (
                                                        item
                                                    ) =>
                                                        item !==
                                                        surface
                                                ),
                                                urlMinPrice,
                                                urlMaxPrice
                                            )
                                        }
                                        className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                                    >
                                        {surface ===
                                        "Hard"
                                            ? "Beton"
                                            : surface ===
                                            "Clay"
                                                ? "Šljaka"
                                                : surface ===
                                                "Grass"
                                                    ? "Trava"
                                                    : "Tepih"}{" "}
                                        ×
                                    </button>
                                )
                            )}

                            {urlMinPrice && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateFilters(
                                            urlSortBy,
                                            urlSurfaceTypes,
                                            "",
                                            urlMaxPrice
                                        )
                                    }
                                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                                >
                                    Od{" "}
                                    {urlMinPrice}{" "}
                                    RSD/h ×
                                </button>
                            )}

                            {urlMaxPrice && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateFilters(
                                            urlSortBy,
                                            urlSurfaceTypes,
                                            urlMinPrice,
                                            ""
                                        )
                                    }
                                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                                >
                                    Do{" "}
                                    {urlMaxPrice}{" "}
                                    RSD/h ×
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="ml-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                            >
                                Obriši sve
                            </button>
                        </div>
                    )}

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

