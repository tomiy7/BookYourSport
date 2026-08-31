"use client";

import {
    useEffect,
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


function formatRole(role: string) {
    switch (role.toLowerCase()) {
        case "admin":
            return "Admin";

        case "club":
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


export default function UsersPage() {

    const router =
        useRouter();


    // ==========================================
    // STATE
    // ==========================================

    const [users, setUsers] =
        useState<User[]>([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const [search, setSearch] =
        useState("");


    const [roleFilter, setRoleFilter] =
        useState("All");


    const [statusFilter, setStatusFilter] =
        useState("All");


    // ==========================================
    // LOAD USERS
    // ==========================================

    useEffect(() => {

        const token =
            getAccessToken();


        if (!token) {

            router.replace(
                "/login"
            );

            return;

        }


        loadUsers(token);

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);


    async function loadUsers(
        token: string,
        searchValue = ""
    ) {

        try {

            setLoading(true);

            setError("");


            const params =
                new URLSearchParams();


            if (
                searchValue.trim()
            ) {

                params.set(
                    "search",
                    searchValue.trim()
                );

            }


            const url =
                `${process.env.NEXT_PUBLIC_API_URL}/auth/users${
                    params.toString()
                        ? `?${params.toString()}`
                        : ""
                }`;


            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Nije moguće učitati korisnike."
                );

            }


            const data =
                await response.json();


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


    // ==========================================
    // SEARCH
    // ==========================================

    function handleSearch() {

        const token =
            getAccessToken();


        if (!token) {

            router.replace(
                "/login"
            );

            return;

        }


        loadUsers(
            token,
            search
        );

    }


    // ==========================================
    // FILTERED USERS
    // ==========================================

    const filteredUsers =
        users.filter(
            (user) => {

                const roleMatches =
                    roleFilter === "All" ||
                    user.role === roleFilter;


                const statusMatches =
                    statusFilter === "All" ||
                    user.approvalStatus ===
                    statusFilter;


                return (
                    roleMatches &&
                    statusMatches
                );

            }
        );


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <main className="flex min-h-screen flex-col bg-zinc-50">

            <AdminHeader />


            <section className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">


                {/* NASLOV */}

                <div>

                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">
                        Admin Panel
                    </p>


                    <h1 className="text-3xl font-bold text-zinc-900">
                        Korisnici
                    </h1>


                    <p className="mt-3 text-zinc-600">
                        Pregled svih korisnika platforme i njihovih
                        trenutnih statusa.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

                        {error}

                    </div>

                )}


                {/* FILTERS */}

                <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">

                    <div className="grid gap-4 lg:grid-cols-4">


                        {/* SEARCH */}

                        <div className="lg:col-span-2">

                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                Pretraga
                            </label>


                            <input
                                type="text"

                                value={search}

                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }

                                onKeyDown={(event) => {

                                    if (
                                        event.key === "Enter"
                                    ) {

                                        handleSearch();

                                    }

                                }}

                                placeholder="Ime, prezime ili email"

                                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />

                        </div>


                        {/* ROLE */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                Rola
                            </label>


                            <select
                                value={roleFilter}

                                onChange={(event) =>
                                    setRoleFilter(
                                        event.target.value
                                    )
                                }

                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-600"
                            >

                                <option value="All">
                                    Sve role
                                </option>

                                <option value="Player">
                                    Player
                                </option>

                                <option value="Club">
                                    Club Owner
                                </option>

                                <option value="Admin">
                                    Admin
                                </option>

                            </select>

                        </div>


                        {/* STATUS */}

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                Status zahteva
                            </label>


                            <select
                                value={statusFilter}

                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }

                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-600"
                            >

                                <option value="All">
                                    Svi statusi
                                </option>

                                <option value="NotRequested">
                                    Nije zatražen
                                </option>

                                <option value="Requested">
                                    Na čekanju
                                </option>

                                <option value="Approved">
                                    Odobren
                                </option>

                                <option value="Rejected">
                                    Odbijen
                                </option>

                            </select>

                        </div>

                    </div>


                    <button
                        type="button"

                        onClick={
                            handleSearch
                        }

                        className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >

                        Pretraži

                    </button>

                </div>


                {/* LOADING */}

                {loading && (

                    <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">

                        <p className="text-zinc-500">
                            Učitavanje korisnika...
                        </p>

                    </div>

                )}


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    filteredUsers.length === 0 && (

                        <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">

                            <h2 className="text-lg font-semibold text-zinc-900">
                                Nema pronađenih korisnika
                            </h2>


                            <p className="mt-2 text-sm text-zinc-500">
                                Promeni kriterijume pretrage ili filtere.
                            </p>

                        </div>

                    )}


                {/* TABLE */}

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


                                                {/* APPROVAL */}

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

                                                    {user.contractStatus ||
                                                        "-"}

                                                </td>


                                                {/* SUBSCRIPTION */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">

                                                    {user.subscriptionStatus ||
                                                        "-"}

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