"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import Header from "../Header";
import Footer from "../Footer";


type ReservationRequest = {
    date: string;
    startTime: string;
    endTime: string;
};


type Price = {
    amount?: number;
    currency?: string;
};


type ReservationResponse = {
    id?: string;
    startTime?: string;
    endTime?: string;
    price?: Price;
    status?: string;
};


// ==========================================
// FORMAT DATUMA
// Primer:
// četvrtak, 03.09.2026.
// ==========================================

function formatDate(
    dateString: string
) {
    const dateObject = new Date(
        `${dateString}T12:00:00`
    );


    const weekday =
        new Intl.DateTimeFormat(
            "sr-Latn-RS",
            {
                weekday: "long",
            }
        ).format(
            dateObject
        );


    const date =
        new Intl.DateTimeFormat(
            "sr-Latn-RS",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        ).format(
            dateObject
        );


    return `${weekday}, ${date}.`;
}


// ==========================================
// FORMAT VREMENA
// Primer:
// 17:00
// ==========================================

function formatTime(
    dateTimeString: string
) {
    return new Intl.DateTimeFormat(
        "sr-Latn-RS",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Europe/Belgrade",
        }
    ).format(
        new Date(
            dateTimeString
        )
    );
}


// ==========================================
// FORMAT CENE
// ==========================================

function formatPrice(
    amount?: number,
    currency = "RSD"
) {
    if (
        amount === undefined ||
        amount === null
    ) {
        return null;
    }


    return new Intl.NumberFormat(
        "sr-Latn-RS",
        {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }
    ).format(
        amount
    );
}


// ==========================================
// PAYMENT PAGE
// ==========================================

export default function PaymentPage() {

    const router =
        useRouter();

    const searchParams =
        useSearchParams();


    // ==========================================
    // URL PARAMETRI
    // ==========================================

    const clubId =
        searchParams.get(
            "clubId"
        ) || "";


    const clubName =
        searchParams.get(
            "clubName"
        ) || "";


    const courtId =
        searchParams.get(
            "courtId"
        ) || "";


    const courtName =
        searchParams.get(
            "courtName"
        ) || "";


    const reservationsParam =
        searchParams.get(
            "reservations"
        );


    // ==========================================
    // STATE
    // ==========================================

    const [
        loading,
        setLoading,
    ] =
        useState(
            false
        );


    const [
        reservation,
        setReservation,
    ] =
        useState<
            ReservationResponse | null
        >(
            null
        );


    const [
        error,
        setError,
    ] =
        useState(
            ""
        );


    const [
        createdReservations,
        setCreatedReservations,
    ] =
        useState<
            ReservationResponse[]
        >(
            []
        );


    // ==========================================
    // PARSIRANJE REZERVACIJA IZ URL-A
    // ==========================================

    let reservations:
        ReservationRequest[] = [];


    try {

        reservations =
            reservationsParam
                ? JSON.parse(
                    reservationsParam
                )
                : [];


        // Dodatna provera da stvarno imamo niz

        if (
            !Array.isArray(
                reservations
            )
        ) {
            reservations = [];
        }

    } catch {

        reservations = [];

    }


    // ==========================================
    // PROVERA DA LI SU PODACI VALIDNI
    // ==========================================

    const hasReservationData =
        Boolean(
            clubId &&
            courtId &&
            reservations.length > 0
        );


    // ==========================================
    // STRANICA NA KOJU VRAĆAMO USERA
    // ==========================================

    const fallbackRoute =
        clubId
            ? `/clubs/${clubId}`
            : "/clubs";


    // ==========================================
    // ČIŠĆENJE STARIH DEVELOPMENT PODATAKA
    //
    // VAŽNO:
    // Ne brišemo accessToken!
    // ==========================================

    useEffect(() => {

        const oldReservationKeys = [

            "reservationData",

            "selectedReservation",

            "reservation",

            "paymentData",

            "selectedSlots",

            "bookingData",

        ];


        oldReservationKeys.forEach(
            (
                key
            ) => {

                localStorage.removeItem(
                    key
                );

                sessionStorage.removeItem(
                    key
                );

            }
        );

    }, []);


    // ==========================================
    // ZAŠTITA OD POKVARENOG / PAYMENT URL-A
    //
    // Ako nemamo sve potrebne podatke,
    // vraćamo korisnika nazad na klub.
    // ==========================================

    useEffect(() => {

        if (
            hasReservationData
        ) {
            return;
        }


        const timeoutId =
            window.setTimeout(
                () => {

                    router.replace(
                        fallbackRoute
                    );

                },
                1500
            );


        return () => {

            window.clearTimeout(
                timeoutId
            );

        };

    }, [
        hasReservationData,
        fallbackRoute,
        router,
    ]);


    // ==========================================
    // KREIRANJE REZERVACIJA
    //
    // Svaki termin šaljemo backendu
    // kao posebnu rezervaciju.
    // ==========================================

    async function createReservations() {

        if (
            !hasReservationData
        ) {
            return;
        }


        const token =
            localStorage.getItem(
                "accessToken"
            );


        if (
            !token
        ) {

            router.push(
                "/login"
            );

            return;

        }


        try {

            setLoading(
                true
            );

            setError(
                ""
            );

            setCreatedReservations(
                []
            );


            const created:
                ReservationResponse[] = [];


            // ======================================
            // Kreiramo svaku rezervaciju
            // ======================================

            for (
                const selectedReservation
                of reservations
                ) {

                const response =
                    await fetch(
                        `${process.env.NEXT_PUBLIC_RESERVATION_URL}/api/clubs/${clubId}/courts/${courtId}/reservations`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,

                            },

                            body:
                                JSON.stringify(
                                    {
                                        startTime:
                                        selectedReservation.startTime,

                                        endTime:
                                        selectedReservation.endTime,
                                    }
                                ),
                        }
                    );


                let data:
                    ReservationResponse &
                    {
                        message?: string;
                        error?: string;
                    };


                try {

                    data =
                        await response.json();

                } catch {

                    throw new Error(
                        "Server je vratio neispravan odgovor."
                    );

                }


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.message ||
                        data.error ||
                        "Jedan od termina više nije dostupan."
                    );

                }


                created.push(
                    data
                );

            }


            setCreatedReservations(
                created
            );


            // Čuvamo poslednju kreiranu rezervaciju
            // ako nam kasnije zatreba za plaćanje

            if (
                created.length > 0
            ) {

                setReservation(
                    created[
                    created.length - 1
                        ]
                );

            }

        } catch (
            error
            ) {

            console.error(
                error
            );


            setError(
                error instanceof Error
                    ? error.message
                    : "Došlo je do greške prilikom kreiranja rezervacija."
            );

        } finally {

            setLoading(
                false
            );

        }

    }


    // ==========================================
    // POVRATAK NA KLUB
    // ==========================================

    function goBack() {

        router.push(
            fallbackRoute
        );

    }


    // ==========================================
    // UKUPNA CENA
    // ==========================================

    const totalPrice =
        createdReservations.reduce(
            (
                sum,
                createdReservation
            ) =>
                sum +
                (
                    createdReservation.price
                        ?.amount || 0
                ),
            0
        );


    const currency =
        createdReservations.find(
            (
                createdReservation
            ) =>
                createdReservation.price
                    ?.currency
        )
            ?.price
            ?.currency ||
        "RSD";


    return (

        <main className="min-h-screen bg-zinc-50">

            <Header />


            <div className="mx-auto max-w-4xl px-6 py-16">


                {/* ================================= */}
                {/* NASLOV */}
                {/* ================================= */}

                <section className="text-center">

                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">

                        Pregled rezervacije

                    </span>


                    <h1 className="mt-3 text-4xl font-bold text-zinc-900">

                        Tvoji termini

                    </h1>


                    <p className="mx-auto mt-4 max-w-xl text-zinc-600">

                        Proveri sve izabrane termine
                        pre potvrde.

                    </p>

                </section>


                {/* ================================= */}
                {/* NEMA PODATAKA */}
                {/* ================================= */}

                {!hasReservationData && (

                    <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

                        <h2 className="text-xl font-bold text-red-700">

                            Podaci o rezervaciji nisu pronađeni

                        </h2>


                        <p className="mt-3 text-red-600">

                            Podaci za rezervaciju nisu kompletni.
                            Vraćamo te nazad.

                        </p>


                        <button

                            type="button"

                            onClick={() =>
                                router.replace(
                                    fallbackRoute
                                )
                            }

                            className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"

                        >

                            Vrati se nazad

                        </button>

                    </div>

                )}


                {/* ================================= */}
                {/* PREGLED TERMINA */}
                {/* ================================= */}

                {hasReservationData && (

                    <section className="mt-12 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">


                        {/* ========================= */}
                        {/* KLUB I TEREN */}
                        {/* ========================= */}

                        <div className="border-b border-zinc-200 pb-6">

                            <p className="text-sm text-zinc-500">

                                Klub

                            </p>


                            <h2 className="mt-1 text-2xl font-bold text-zinc-900">

                                {clubName ||
                                    "Izabrani teniski klub"}

                            </h2>


                            <p className="mt-3 text-zinc-600">

                                {courtName ||
                                    "Izabrani teren"}

                            </p>

                        </div>


                        {/* ========================= */}
                        {/* IZABRANI TERMINI */}
                        {/* ========================= */}

                        <div className="mt-8">

                            <h3 className="text-lg font-bold text-zinc-900">

                                Izabrani termini

                            </h3>


                            <div className="mt-5 space-y-3">

                                {reservations.map(
                                    (
                                        selectedReservation,
                                        index
                                    ) => (

                                        <div

                                            key={`${selectedReservation.date}-${selectedReservation.startTime}-${index}`}

                                            className="flex flex-col gap-2 rounded-2xl bg-zinc-50 p-5 sm:flex-row sm:items-center sm:justify-between"

                                        >

                                            <div>

                                                <p className="font-bold capitalize text-zinc-900">

                                                    {formatDate(
                                                        selectedReservation.date
                                                    )}

                                                </p>


                                                <p className="mt-1 text-zinc-600">

                                                    {formatTime(
                                                        selectedReservation.startTime
                                                    )}

                                                    {" – "}

                                                    {formatTime(
                                                        selectedReservation.endTime
                                                    )}

                                                </p>

                                            </div>


                                            <span className="font-semibold text-green-700">

                                                Termin{" "}

                                                {index + 1}

                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* ========================= */}
                        {/* ERROR */}
                        {/* ========================= */}

                        {error && (

                            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

                                {error}

                            </div>

                        )}


                        {/* ========================= */}
                        {/* POTVRDA REZERVACIJE */}
                        {/* ========================= */}

                        {createdReservations.length ===
                            0 && (

                                <div className="mt-8 border-t border-zinc-200 pt-8">

                                    <h3 className="text-lg font-bold text-zinc-900">

                                        Potvrda rezervacija

                                    </h3>


                                    <p className="mt-3 leading-7 text-zinc-600">

                                        Klikom na dugme potvrđuješ
                                        sve izabrane termine.
                                        Svaki termin će biti kreiran
                                        kao posebna rezervacija.

                                    </p>


                                    <div className="mt-6 flex flex-wrap gap-4">


                                        {/* IZMENI */}

                                        <button

                                            type="button"

                                            onClick={
                                                goBack
                                            }

                                            disabled={
                                                loading
                                            }

                                            className="rounded-xl border border-zinc-300 bg-white px-7 py-4 font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"

                                        >

                                            Izmeni termine

                                        </button>


                                        {/* POTVRDI */}

                                        <button

                                            type="button"

                                            onClick={
                                                createReservations
                                            }

                                            disabled={
                                                loading
                                            }

                                            className="rounded-xl bg-green-700 px-7 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"

                                        >

                                            {loading
                                                ? "Rezervacije se kreiraju..."
                                                : "Potvrdi rezervacije →"}

                                        </button>

                                    </div>

                                </div>

                            )}


                        {/* ========================= */}
                        {/* USPEŠNO KREIRANE */}
                        {/* ========================= */}

                        {createdReservations.length >
                            0 && (

                                <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">


                                    <h3 className="text-xl font-bold text-green-900">

                                        ✓ Rezervacije su uspešno kreirane

                                    </h3>


                                    <p className="mt-3 text-green-800">

                                        Uspešno je kreirano{" "}

                                        {
                                            createdReservations.length
                                        }

                                        {" "}

                                        {createdReservations.length ===
                                        1
                                            ? "rezervacija"
                                            : "rezervacije"}.

                                    </p>


                                    {/* UKUPNA CENA */}

                                    {totalPrice > 0 && (

                                        <div className="mt-6 border-t border-green-200 pt-5">

                                            <p className="text-sm font-semibold uppercase tracking-wider text-green-800">

                                                Ukupna cena

                                            </p>


                                            <p className="mt-2 text-3xl font-bold text-zinc-900">

                                                {formatPrice(
                                                    totalPrice,
                                                    currency
                                                )}

                                            </p>

                                        </div>

                                    )}


                                    <button

                                        type="button"

                                        onClick={() =>
                                            router.replace(
                                                "/"
                                            )
                                        }

                                        className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"

                                    >

                                        Nazad na početnu

                                    </button>

                                </div>

                            )}

                    </section>

                )}

            </div>


            <Footer />

        </main>

    );

}