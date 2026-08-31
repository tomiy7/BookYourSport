"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import PlayerHeader from "./PlayerHeader";

import {
    getAccessToken,
} from "@/lib/auth";

import {
    getBalance,
} from "@/lib/paymentApi";

import {
    getDashboardPath,
    getStoredUser,
} from "@/lib/user";


interface User {
    firstName: string;
    lastName: string;
    email: string;
    city?: string | null;
    dateOfBirth?: string | null;
    role: string;
}


function formatPrice(
    amount: number,
    currency = "RSD"
) {
    return new Intl.NumberFormat(
        "sr-Latn-RS",
        {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }
    ).format(amount);
}


export default function PlayerDashboard() {

    const router =
        useRouter();


    // ==========================================
    // USER
    // ==========================================

    const [user, setUser] =
        useState<User | null>(null);


    // ==========================================
    // WALLET
    // ==========================================

    const [balance, setBalance] =
        useState(0);


    const [currency, setCurrency] =
        useState("RSD");


    // ==========================================
    // LOADING
    // ==========================================

    const [loading, setLoading] =
        useState(true);


    const [walletLoading, setWalletLoading] =
        useState(true);


    // ==========================================
    // AUTH + ROLE PROVERA
    // ==========================================

    useEffect(() => {

        const accessToken =
            getAccessToken();


        const savedUser =
            getStoredUser();


        // ==========================================
        // KORISNIK NIJE PRIJAVLJEN
        // ==========================================

        if (
            !accessToken ||
            !savedUser
        ) {

            router.replace(
                "/login"
            );

            return;

        }


        // ==========================================
        // PROVERA KOJA JE DASHBOARD PUTANJA
        // ==========================================

        const dashboardPath =
            getDashboardPath(
                savedUser.role
            );


        // ==========================================
        // AKO NIJE PLAYER
        // ==========================================

        if (
            dashboardPath !==
            "/player-dashboard"
        ) {

            router.replace(
                dashboardPath
            );

            return;

        }


        // ==========================================
        // PLAYER MOZE NA DASHBOARD
        // ==========================================

        setUser(
            savedUser as User
        );


        setLoading(
            false
        );

    }, [
        router,
    ]);


    // ==========================================
    // UCITAVANJE WALLET STANJA
    // ==========================================

    useEffect(() => {

        async function loadBalance() {

            // Ne učitavamo wallet dok ne završimo
            // auth i role proveru.

            if (
                loading ||
                !user
            ) {
                return;
            }


            const token =
                getAccessToken();


            if (!token) {

                setWalletLoading(
                    false
                );

                return;

            }


            try {

                setWalletLoading(
                    true
                );


                const wallet =
                    await getBalance(
                        token
                    );


                setBalance(
                    wallet.balance
                );


                setCurrency(
                    wallet.currency
                );

            } catch (error) {

                console.error(
                    "Greška prilikom učitavanja stanja na računu:",
                    error
                );

            } finally {

                setWalletLoading(
                    false
                );

            }

        }


        loadBalance();

    }, [
        loading,
        user,
    ]);


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">

                <p className="text-zinc-500">
                    Učitavanje...
                </p>

            </main>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <main className="min-h-screen bg-[#f7f8f7]">

            <PlayerHeader />


            <section className="mx-auto w-full max-w-6xl px-6 py-10">


                {/* ================================= */}
                {/* NASLOV */}
                {/* ================================= */}

                <div className="mb-9">

                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        MOJ NALOG
                    </span>


                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        Pregled naloga
                    </h1>


                    <p className="mt-3 text-zinc-600">
                        Upravljaj svojim rezervacijama,
                        stanjem na računu i podacima
                        na jednom mestu.
                    </p>

                </div>


                {/* ================================= */}
                {/* GRID */}
                {/* ================================= */}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">


                    {/* ================================= */}
                    {/* AKTIVNE REZERVACIJE */}
                    {/* ================================= */}

                    <section
                        onClick={() =>
                            router.push(
                                "/player-dashboard/reservation"
                            )
                        }
                        className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                    >

                        <div className="border-b border-zinc-200 px-6 py-5">

                            <h2 className="text-xl font-semibold text-zinc-800">
                                Aktivne rezervacije
                            </h2>


                            <p className="mt-1 text-sm text-zinc-500">
                                Pregled tvojih predstojećih
                                termina.
                            </p>

                        </div>


                        <div className="flex min-h-[145px] flex-col items-center justify-center px-6 py-6">

                            <p className="mb-5 text-sm text-zinc-500">
                                Pogledaj svoje aktivne
                                i predstojeće rezervacije.
                            </p>


                            <span className="rounded-lg border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-800">
                                Pogledaj rezervacije
                            </span>

                        </div>

                    </section>


                    {/* ================================= */}
                    {/* STANJE NA RACUNU */}
                    {/* ================================= */}

                    <section
                        onClick={() =>
                            router.push(
                                "/player-dashboard/wallet"
                            )
                        }
                        className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-6 py-5 transition hover:border-green-300 hover:shadow-md"
                    >

                        <p className="text-sm text-zinc-500">
                            Stanje na računu
                        </p>


                        <h2 className="mt-3 text-3xl font-bold text-zinc-800">

                            {walletLoading
                                ? "Učitavanje..."
                                : formatPrice(
                                    balance,
                                    currency
                                )}

                        </h2>


                        <p className="mt-2 text-sm text-zinc-500">
                            Kredit možeš koristiti za
                            plaćanje rezervacija.
                        </p>


                        <div className="mt-6 flex flex-col gap-3">

                            <span
                                onClick={(event) => {

                                    event.stopPropagation();


                                    router.push(
                                        "/player-dashboard/topup"
                                    );

                                }}
                                className="rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                                Dodaj kredit
                            </span>


                            <span className="text-center text-sm font-semibold text-green-800">
                                Pogledaj stanje na računu
                            </span>

                        </div>

                    </section>


                    {/* ================================= */}
                    {/* ISTORIJA REZERVACIJA */}
                    {/* ================================= */}

                    <section
                        onClick={() =>
                            router.push(
                                "/player-dashboard/reservation"
                            )
                        }
                        className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                    >

                        <div className="border-b border-zinc-200 px-6 py-5">

                            <h2 className="text-xl font-semibold text-zinc-800">
                                Istorija rezervacija
                            </h2>


                            <p className="mt-1 text-sm text-zinc-500">
                                Pregled svih prethodnih
                                termina.
                            </p>

                        </div>


                        <div className="px-6 py-6">

                            <span className="text-sm font-semibold text-green-800">
                                Pogledaj kompletnu istoriju
                            </span>

                        </div>

                    </section>


                    {/* ================================= */}
                    {/* CLUB OWNER */}
                    {/* ================================= */}

                    <section
                        onClick={() =>
                            router.push(
                                "/player-dashboard/owner-request"
                            )
                        }
                        className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                    >

                        <div className="border-b border-zinc-200 px-6 py-5">

                            <h2 className="text-xl font-semibold text-zinc-800">
                                Club Owner
                            </h2>


                            <p className="mt-1 text-sm text-zinc-500">
                                Upravljaj svojim klubom i
                                terenima.
                            </p>

                        </div>


                        <div className="px-6 py-6">

                            <p className="max-w-md text-sm leading-6 text-zinc-600">
                                Imaš teniski klub i želiš
                                da upravljaš terenima i
                                rezervacijama preko
                                BookYourSport platforme?
                            </p>


                            <span className="mt-5 inline-block text-sm font-semibold text-green-800">
                                Pošalji zahtev
                            </span>

                        </div>

                    </section>


                    {/* ================================= */}
                    {/* LICNI PODACI */}
                    {/* ================================= */}

                    <section
                        onClick={() =>
                            router.push(
                                "/player-dashboard/profile"
                            )
                        }
                        className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md lg:col-span-2"
                    >

                        <div className="border-b border-zinc-200 px-6 py-5">

                            <h2 className="text-xl font-semibold text-zinc-800">
                                Lični podaci
                            </h2>


                            <p className="mt-1 text-sm text-zinc-500">
                                Podaci povezani sa tvojim
                                nalogom.
                            </p>

                        </div>


                        <div className="grid grid-cols-1 gap-x-12 gap-y-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">


                            {/* IME */}

                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Ime
                                </p>


                                <p className="mt-2 text-sm font-medium text-zinc-800">
                                    {user?.firstName || "-"}
                                </p>

                            </div>


                            {/* PREZIME */}

                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Prezime
                                </p>


                                <p className="mt-2 text-sm font-medium text-zinc-800">
                                    {user?.lastName || "-"}
                                </p>

                            </div>


                            {/* EMAIL */}

                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Email
                                </p>


                                <p className="mt-2 text-sm font-medium text-zinc-800">
                                    {user?.email || "-"}
                                </p>

                            </div>

                        </div>


                        {/* IZMENA PODATAKA */}

                        <div className="border-t border-zinc-200 px-6 py-5">

                            <span className="text-sm font-semibold text-green-800">
                                Izmeni lične podatke
                            </span>

                        </div>

                    </section>

                </div>

            </section>

        </main>

    );
}