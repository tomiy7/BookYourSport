"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";


// ==========================================
// TIP ADRESE
// ==========================================

type Address = {
    city?: string;
    municipality?: string;
    zipCode?: string;
    street?: string;
    country?: string;
    streetNumber?: string;
};


// ==========================================
// TIP KLUBA
// ==========================================

type Club = {
    id: string;
    name: string;
    address?: Address;
    description?: string;
};


// ==========================================
// CLUBS PAGE
// ==========================================

export default function ClubsPage() {

    const [clubs, setClubs] =
        useState<Club[]>([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================
    // DOHVAT SVIH KLUBOVA
    // ==========================================

    useEffect(() => {

        async function loadClubs() {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs`
                );

                if (!response.ok) {
                    throw new Error(
                        "Klubovi nisu dostupni."
                    );
                }

                const data =
                    await response.json();

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


    // ==========================================
    // FILTRIRANJE KLUBOVA
    // ==========================================

    const filteredClubs =
        clubs.filter((club) => {

            const searchText =
                search.toLowerCase().trim();

            // Ako search nije unet,
            // prikazujemo sve klubove.
            if (!searchText) {
                return true;
            }

            return (

                club.name
                    .toLowerCase()
                    .includes(searchText) ||

                club.address?.city
                    ?.toLowerCase()
                    .includes(searchText) ||

                club.address?.municipality
                    ?.toLowerCase()
                    .includes(searchText) ||

                club.address?.street
                    ?.toLowerCase()
                    .includes(searchText) ||

                club.address?.country
                    ?.toLowerCase()
                    .includes(searchText) ||

                club.address?.zipCode
                    ?.toLowerCase()
                    .includes(searchText)

            );

        });


    return (

        <main className="min-h-screen bg-zinc-50">

            <Header />


            <div className="mx-auto max-w-6xl px-6 py-12">


                {/* ================================= */}
                {/* NASLOV */}
                {/* ================================= */}

                <section className="text-center">

                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                        Pronađi klub
                    </span>

                    <h1 className="mt-3 text-4xl font-bold text-zinc-900">
                        Pronađi idealan teniski klub
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
                        Pretraži teniske klubove i pronađi
                        teren koji ti najviše odgovara.
                    </p>

                </section>


                {/* ================================= */}
                {/* SEARCH */}
                {/* ================================= */}

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


                {/* ================================= */}
                {/* LOADING */}
                {/* ================================= */}

                {loading && (

                    <div className="py-20 text-center text-zinc-500">
                        Učitavanje klubova...
                    </div>

                )}


                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {error && (

                    <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
                        {error}
                    </div>

                )}


                {/* ================================= */}
                {/* NEMA REZULTATA */}
                {/* ================================= */}

                {!loading &&
                    !error &&
                    filteredClubs.length === 0 && (

                        <div className="py-20 text-center text-zinc-500">
                            Nema klubova koji odgovaraju
                            tvojoj pretrazi.
                        </div>

                    )}


                {/* ================================= */}
                {/* LISTA KLUBOVA */}
                {/* ================================= */}

                {!loading &&
                    !error &&
                    filteredClubs.length > 0 && (

                        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                            {filteredClubs.map(
                                (club) => (

                                    <Link
                                        key={club.id}
                                        href={`/clubs/${club.id}`}
                                        className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
                                    >

                                        <div className="flex h-full flex-col">


                                            {/* TIP KLUBA */}

                                            <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                                                Teniski klub
                                            </span>


                                            {/* NAZIV */}

                                            <h2 className="mt-3 text-xl font-bold text-zinc-900 transition group-hover:text-green-700">
                                                {club.name}
                                            </h2>


                                            {/* ADRESA */}

                                            {club.address && (

                                                <div className="mt-4 text-sm text-zinc-500">

                                                    <p>

                                                        📍{" "}

                                                        {club.address.street}

                                                        {club.address.street &&
                                                            club.address.streetNumber &&
                                                            " "}

                                                        {club.address.streetNumber}

                                                    </p>


                                                    {(club.address.zipCode ||
                                                        club.address.city) && (

                                                        <p className="mt-1">

                                                            {club.address.zipCode}

                                                            {club.address.zipCode &&
                                                                club.address.city &&
                                                                " "}

                                                            {club.address.city}

                                                        </p>

                                                    )}

                                                </div>

                                            )}


                                            {/* OPIS */}

                                            {club.description && (

                                                <p className="mt-4 line-clamp-3 text-sm text-zinc-600">
                                                    {club.description}
                                                </p>

                                            )}


                                            {/* LINK */}

                                            <div className="mt-auto pt-6 font-semibold text-green-700">

                                                Pogledaj klub
                                                {" →"}

                                            </div>


                                        </div>

                                    </Link>

                                )
                            )}

                        </section>

                    )}

            </div>


            <Footer />

        </main>

    );
}