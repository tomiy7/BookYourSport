"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import AdminHeader from "../AdminHeader";
import Footer from "../../Footer";

import {
    getAccessToken,
} from "@/lib/auth";

import {
    apiFetch,
} from "@/lib/api";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    city: string | null;
    dateOfBirth: string | null;
    role: string;
    approvalStatus: string;
    contractStatus: string | null;
    subscriptionStatus: string | null;
};

type SortOption =
    | "firstNameAsc"
    | "firstNameDesc"
    | "lastNameAsc"
    | "lastNameDesc"
    | "emailAsc"
    | "emailDesc";

function normalizeText(
    value: string | null | undefined
) {
    return (value || "")
        .toLocaleLowerCase("sr-Latn-RS")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function formatRole(role: string) {
    switch (normalizeText(role)) {
        case "admin":
            return "Admin";

        case "club":
        case "clubowner":
        case "club owner":
            return "Club Owner";

        case "player":
            return "Player";

        default:
            return role;
    }
}

function formatApprovalStatus(status: string) {
    switch (status) {
        case "NotRequested":
            return "Nije zatražen";

        case "Requested":
            return "Na čekanju";

        case "Approved":
            return "Odobren";

        case "Rejected":
            return "Odbijen";

        default:
            return status;
    }
}

function approvalStatusClass(status: string) {
    switch (status) {
        case "Approved":
            return "border-green-200 bg-green-50 text-green-700";

        case "Rejected":
            return "border-red-200 bg-red-50 text-red-700";

        case "Requested":
            return "border-yellow-200 bg-yellow-50 text-yellow-700";

        default:
            return "border-zinc-200 bg-zinc-50 text-zinc-600";
    }
}

function formatContractStatus(
    status: string | null
) {
    if (!status) {
        return "-";
    }

    switch (status) {
        case "NotGenerated":
            return "Nije generisan";

        case "Generated":
            return "Generisan";

        case "PendingSignature":
            return "Čeka potpis";

        case "Signed":
            return "Potpisan";

        default:
            return status;
    }
}

function formatSubscriptionStatus(
    status: string | null
) {
    if (!status) {
        return "-";
    }

    switch (status) {
        case "NotStarted":
            return "Nije započeta";

        case "Pending":
            return "Na čekanju";

        case "Paid":
            return "Plaćena";

        default:
            return status;
    }
}

export default function UsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] =
        useState("All");

    const [sortOption, setSortOption] =
        useState<SortOption>("firstNameAsc");

    const [filtersOpen, setFiltersOpen] =
        useState(false);

    const [sortDirections, setSortDirections] =
        useState<{
            firstName?: "asc" | "desc";
            lastName?: "asc" | "desc";
            email?: "asc" | "desc";
        }>({
            firstName: "asc",
        });

    async function loadUsers() {
        try {
            setLoading(true);
            setError("");

            const response = await apiFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
                {
                    method: "GET",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Nije moguće učitati korisnike."
                );
            }

            const data = await response.json();

            setUsers(data);
        } catch (err) {
            console.error(err);

            setError(
                "Nije moguće učitati korisnike."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            router.replace("/login");
            return;
        }

        loadUsers();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedSearch =
            normalizeText(search);

        const searchWords =
            normalizedSearch
                .split(/\s+/)
                .filter(Boolean);

        const result = users.filter((user) => {
            const normalizedUserRole =
                normalizeText(user.role);

            const normalizedFilterRole =
                normalizeText(roleFilter);

            const roleMatches =
                roleFilter === "All" ||
                normalizedUserRole ===
                normalizedFilterRole;

            if (!roleMatches) {
                return false;
            }

            if (searchWords.length === 0) {
                return true;
            }

            /*
             * Pretraga se radi SAMO po:
             * - imenu
             * - prezimenu
             * - emailu
             * - gradu
             */

            const searchableFields = [
                user.firstName,
                user.lastName,
                user.email,
                user.city,
            ].map(normalizeText);

            /*
             * Svaka reč iz pretrage mora da postoji
             * u barem jednom od dozvoljenih polja.
             *
             * Primer:
             * "Milica Tosic"
             *
             * Milica -> firstName
             * Tosic  -> lastName
             */

            return searchWords.every(
                (word) =>
                    searchableFields.some(
                        (field) =>
                            field.includes(word)
                    )
            );
        });

        const activeSorts: Array<
            [
                "firstName" | "lastName" | "email",
                "asc" | "desc"
            ]
        > = [];

        if (sortDirections.firstName) {
            activeSorts.push([
                "firstName",
                sortDirections.firstName,
            ]);
        }

        if (sortDirections.lastName) {
            activeSorts.push([
                "lastName",
                sortDirections.lastName,
            ]);
        }

        if (sortDirections.email) {
            activeSorts.push([
                "email",
                sortDirections.email,
            ]);
        }

        return [...result].sort((a, b) => {
            for (const [field, direction] of activeSorts) {
                const valueA =
                    normalizeText(
                        field === "firstName"
                            ? a.firstName
                            : field === "lastName"
                            ? a.lastName
                            : a.email
                    );

                const valueB =
                    normalizeText(
                        field === "firstName"
                            ? b.firstName
                            : field === "lastName"
                            ? b.lastName
                            : b.email
                    );

                const comparison =
                    valueA.localeCompare(
                        valueB,
                        "sr-Latn-RS"
                    );

                if (comparison !== 0) {
                    return direction === "desc"
                        ? -comparison
                        : comparison;
                }
            }

            return 0;
        });
    }, [
        users,
        search,
        roleFilter,
        sortOption,
        sortDirections,
    ]);

    function resetFilters() {
        setSearch("");
        setRoleFilter("All");
        setSortOption("firstNameAsc");
        setSortDirections({
            firstName: "asc",
        });
    }

    function toggleSortDirection(
        field:
            | "firstName"
            | "lastName"
            | "email",
        direction: "asc" | "desc"
    ) {
        setSortDirections((current) => {
            const next = { ...current };

            if (next[field] === direction) {
                delete next[field];
            } else {
                next[field] = direction;
            }

            return next;
        });

        const firstNameDirection =
            field === "firstName"
                ? sortDirections.firstName === "asc" &&
                  direction === "asc"
                    ? undefined
                    : sortDirections.firstName === "desc" &&
                      direction === "desc"
                    ? undefined
                    : direction
                : sortDirections.firstName;

        if (firstNameDirection) {
            setSortOption(
                firstNameDirection === "asc"
                    ? "firstNameAsc"
                    : "firstNameDesc"
            );
        } else if (
            field === "firstName" &&
            !sortDirections.lastName &&
            !sortDirections.email
        ) {
            setSortOption("firstNameAsc");
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">

            <AdminHeader />

            <section className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">

                {/* HEADER */}

                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">
                        Admin Panel
                    </p>

                    <h1 className="text-3xl font-bold text-zinc-900">
                        Korisnici
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Pregled svih korisnika platforme i njihovih trenutnih statusa.
                    </p>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* SEARCH + FILTERS + SORT */}

                <div className="mt-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Ime, prezime, email ili grad"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setFiltersOpen(
                                    !filtersOpen
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:border-green-600 hover:text-green-700"
                        >
                            <span className="text-base">
                                ☰
                            </span>
                            Filteri
                            {roleFilter !== "All" && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-xs font-bold text-white">
                                    1
                                </span>
                            )}
                        </button>

                        <div className="relative">
                            <details className="group">
                                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
                                    <span>
                                        Sortiraj
                                    </span>
                                    <span className="text-zinc-400">
                                        ▾
                                    </span>
                                </summary>

                                <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 shadow-lg">
                                    {[
                                        [
                                            "firstName",
                                            "Ime",
                                        ],
                                        [
                                            "lastName",
                                            "Prezime",
                                        ],
                                        [
                                            "email",
                                            "Email",
                                        ],
                                    ].map(
                                        (
                                            [
                                                field,
                                                label,
                                            ]
                                        ) => {
                                            const currentDirection =
                                                sortDirections[
                                                    field as
                                                        | "firstName"
                                                        | "lastName"
                                                        | "email"
                                                ];

                                            return (
                                                <div
                                                    key={
                                                        field
                                                    }
                                                    className="grid grid-cols-[1fr_28px_28px] items-center gap-1 py-1"
                                                >
                                                    <span className="text-sm font-medium text-zinc-800">
                                                        {
                                                            label
                                                        }
                                                    </span>

                                                    <button
                                                        type="button"
                                                        title="A–Z"
                                                        aria-label={`${label} A–Z`}
                                                        onClick={() =>
                                                            toggleSortDirection(
                                                                field as
                                                                    | "firstName"
                                                                    | "lastName"
                                                                    | "email",
                                                                "asc"
                                                            )
                                                        }
                                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none ${
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
                                                        title="Z–A"
                                                        aria-label={`${label} Z–A`}
                                                        onClick={() =>
                                                            toggleSortDirection(
                                                                field as
                                                                    | "firstName"
                                                                    | "lastName"
                                                                    | "email",
                                                                "desc"
                                                            )
                                                        }
                                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none ${
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
                            </details>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-800">
                                        Filteri
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        Filtriraj korisnike po roli.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFiltersOpen(
                                            false
                                        )
                                    }
                                    className="text-lg text-zinc-400 hover:text-zinc-700"
                                    aria-label="Zatvori filtere"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {[
                                    [
                                        "All",
                                        "Sve role",
                                    ],
                                    [
                                        "Player",
                                        "Player",
                                    ],
                                    [
                                        "Club",
                                        "Club Owner",
                                    ],
                                    [
                                        "Admin",
                                        "Admin",
                                    ],
                                ].map(
                                    ([
                                        value,
                                        label,
                                    ]) => (
                                        <button
                                            key={
                                                value
                                            }
                                            type="button"
                                            onClick={() =>
                                                setRoleFilter(
                                                    value
                                                )
                                            }
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
    roleFilter ===
    value
        ? "border-green-600 bg-green-50 font-semibold text-green-700"
        : "border-zinc-200 bg-white text-zinc-700 hover:border-green-400"
}`}
                                        >
                                            {label}
                                        </button>
                                    )
                                )}

                                {roleFilter !==
                                    "All" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRoleFilter(
                                                "All"
                                            )
                                        }
                                        className="ml-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                                    >
                                        Obriši filter
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {(roleFilter !== "All" ||
                        search) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch(
                                            ""
                                        )
                                    }
                                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                                >
                                    Pretraga:{" "}
                                    {search} ×
                                </button>
                            )}

                            {roleFilter !==
                                "All" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRoleFilter(
                                            "All"
                                        )
                                    }
                                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"
                                >
                                    Rola:{" "}
                                    {formatRole(
                                        roleFilter
                                    )}{" "}
                                    ×
                                </button>
                            )}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                        >
                            Resetuj filtere
                        </button>
                    </div>
                </div>

                {/* LOADING */}

                {loading && (
                    <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
                        <p className="text-zinc-500">
                            Učitavanje korisnika...
                        </p>
                    </div>
                )}

                {/* NO RESULTS */}

                {!loading &&
                    !error &&
                    filteredUsers.length === 0 && (
                        <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">

                            <h2 className="text-lg font-semibold text-zinc-900">
                                Nema pronađenih korisnika
                            </h2>

                            <p className="mt-2 text-sm text-zinc-500">
                                Promeni kriterijume pretrage ili filter.
                            </p>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                                Resetuj filtere
                            </button>

                        </div>
                    )}

                {/* USERS TABLE */}

                {!loading &&
                    !error &&
                    filteredUsers.length > 0 && (

                        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">

                            <div className="border-b border-zinc-200 px-6 py-4">

                                <p className="text-sm font-semibold text-zinc-700">
                                    Pronađeno korisnika:{" "}
                                    <span className="text-green-700">
                                        {filteredUsers.length}
                                    </span>
                                </p>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="w-full text-left">

                                    <thead className="border-b border-zinc-200 bg-zinc-50">

                                    <tr>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Korisnik
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Grad
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Rola
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Status zahteva
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Ugovor
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Pretplata
                                        </th>

                                    </tr>

                                    </thead>

                                    <tbody>

                                    {filteredUsers.map(
                                        (user) => (

                                            <tr
                                                key={user.id}
                                                className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                                            >

                                                {/* USER */}

                                                <td className="px-6 py-5">

                                                    <p className="font-semibold text-zinc-900">
                                                        {user.firstName}{" "}
                                                        {user.lastName}
                                                    </p>

                                                    <p className="mt-1 text-sm text-zinc-500">
                                                        {user.email}
                                                    </p>

                                                </td>

                                                {/* CITY */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">
                                                    {user.city || "-"}
                                                </td>

                                                {/* ROLE */}

                                                <td className="px-6 py-5">

                                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                                                            {formatRole(
                                                                user.role
                                                            )}
                                                        </span>

                                                </td>

                                                {/* APPROVAL STATUS */}

                                                <td className="px-6 py-5">

                                                        <span
                                                            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${approvalStatusClass(
    user.approvalStatus
)}`}
                                                        >
                                                            {formatApprovalStatus(
                                                                user.approvalStatus
                                                            )}
                                                        </span>

                                                </td>

                                                {/* CONTRACT */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">
                                                    {formatContractStatus(
                                                        user.contractStatus
                                                    )}
                                                </td>

                                                {/* SUBSCRIPTION */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">
                                                    {formatSubscriptionStatus(
                                                        user.subscriptionStatus
                                                    )}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    )}

            </section>

            <Footer />

        </main>
    );
}