"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import Link from "next/link";

import AdminHeader from "../AdminHeader";
import Footer from "../../Footer";

import {
    getAccessToken,
} from "@/lib/auth";


type OwnerRequest = {
    id: string;

    firstName: string;

    lastName: string;

    email: string;

    city: string | null;

    approvalStatus: string;
};


export default function OwnerRequestsPage() {

    const router =
        useRouter();


    // ==========================================
    // STATE
    // ==========================================

    const [requests, setRequests] =
        useState<OwnerRequest[]>([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const [actionError, setActionError] =
        useState("");


    const [processingId, setProcessingId] =
        useState<string | null>(
            null
        );


    // ==========================================
    // LOAD REQUESTS
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


        loadRequests(
            token
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);


    async function loadRequests(
        token: string
    ) {

        try {

            setLoading(true);

            setError("");


            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/pending-approvals`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Nije moguće učitati Club Owner zahteve."
                );

            }


            const data =
                await response.json();


            setRequests(
                data
            );

        } catch (err) {

            console.error(
                err
            );


            setError(
                "Nije moguće učitati Club Owner zahteve."
            );

        } finally {

            setLoading(
                false
            );

        }

    }


    // ==========================================
    // UPDATE STATUS
    // ==========================================

    async function updateRequestStatus(
        userId: string,
        approvalStatus:
            | "approved"
            | "rejected"
    ) {

        const token =
            getAccessToken();


        if (!token) {

            router.replace(
                "/login"
            );

            return;

        }


        try {

            setProcessingId(
                userId
            );


            setActionError(
                ""
            );


            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${userId}/approval-status`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            approvalStatus,
                        }),
                    }
                );


            if (!response.ok) {

                const errorData =
                    await response
                        .json()
                        .catch(
                            () => null
                        );


                throw new Error(
                    errorData?.message ||
                    errorData?.detail ||
                    "Nije moguće ažurirati zahtev."
                );

            }


            // Endpoint prikazuje samo pending zahteve,
            // zato nakon odobravanja ili odbijanja
            // uklanjamo korisnika sa liste.

            setRequests(
                (
                    currentRequests
                ) =>
                    currentRequests.filter(
                        (
                            request
                        ) =>
                            request.id !==
                            userId
                    )
            );

        } catch (err) {

            console.error(
                err
            );


            setActionError(

                err instanceof Error

                    ? err.message

                    : "Nije moguće ažurirati zahtev."

            );

        } finally {

            setProcessingId(
                null
            );

        }

    }


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
                        Club Owner zahtevi
                    </h1>


                    <p className="mt-3 text-zinc-600">
                        Pregledaj zahteve koji trenutno čekaju
                        administrativnu odluku.
                    </p>


                    <Link
                        href="/admin-dashboard/users"
                        className="mt-4 inline-block text-sm font-semibold text-green-700 transition hover:text-green-800"
                    >
                        Pogledaj sve korisnike i statuse →
                    </Link>

                </div>


                {/* ACTION ERROR */}

                {actionError && (

                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

                        {actionError}

                    </div>

                )}


                {/* ERROR */}

                {error && (

                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

                        {error}

                    </div>

                )}


                {/* LOADING */}

                {loading && (

                    <div className="mt-10 rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">

                        <p className="text-zinc-500">
                            Učitavanje zahteva...
                        </p>

                    </div>

                )}


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    requests.length === 0 && (

                        <div className="mt-10 rounded-xl border border-zinc-200 bg-white px-6 py-14 text-center">

                            <h2 className="text-lg font-semibold text-zinc-900">
                                Nema zahteva na čekanju
                            </h2>


                            <p className="mt-2 text-sm text-zinc-500">
                                Trenutno nema novih Club Owner zahteva
                                koji čekaju odobrenje.
                            </p>


                            <Link
                                href="/admin-dashboard/users"
                                className="mt-5 inline-block text-sm font-semibold text-green-700"
                            >
                                Pogledaj sve korisnike →
                            </Link>

                        </div>

                    )}


                {/* REQUESTS TABLE */}

                {!loading &&
                    !error &&
                    requests.length > 0 && (

                        <div className="mt-10 overflow-hidden rounded-xl border border-zinc-200 bg-white">

                            <div className="overflow-x-auto">

                                <table className="w-full text-left">


                                    {/* HEADER */}

                                    <thead className="border-b border-zinc-200 bg-zinc-50">

                                    <tr>

                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Korisnik
                                        </th>


                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Email
                                        </th>


                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Grad
                                        </th>


                                        <th className="px-6 py-4 text-sm font-semibold text-zinc-700">
                                            Status
                                        </th>


                                        <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-700">
                                            Akcije
                                        </th>

                                    </tr>

                                    </thead>


                                    {/* BODY */}

                                    <tbody>

                                    {requests.map(
                                        (
                                            request
                                        ) => (

                                            <tr
                                                key={
                                                    request.id
                                                }

                                                className="border-b border-zinc-100 last:border-b-0"
                                            >


                                                {/* USER */}

                                                <td className="px-6 py-5">

                                                    <p className="font-semibold text-zinc-900">

                                                        {
                                                            request.firstName
                                                        }{" "}

                                                        {
                                                            request.lastName
                                                        }

                                                    </p>

                                                </td>


                                                {/* EMAIL */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">

                                                    {
                                                        request.email
                                                    }

                                                </td>


                                                {/* CITY */}

                                                <td className="px-6 py-5 text-sm text-zinc-600">

                                                    {
                                                        request.city ||
                                                        "-"
                                                    }

                                                </td>


                                                {/* STATUS */}

                                                <td className="px-6 py-5">

                                                        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">

                                                            Na čekanju

                                                        </span>

                                                </td>


                                                {/* ACTIONS */}

                                                <td className="px-6 py-5">

                                                    <div className="flex justify-end gap-3">


                                                        {/* APPROVE */}

                                                        <button
                                                            type="button"

                                                            disabled={
                                                                processingId ===
                                                                request.id
                                                            }

                                                            onClick={() =>
                                                                updateRequestStatus(
                                                                    request.id,
                                                                    "approved"
                                                                )
                                                            }

                                                            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >

                                                            {processingId ===
                                                            request.id
                                                                ? "Obrada..."
                                                                : "Odobri"}

                                                        </button>


                                                        {/* REJECT */}

                                                        <button
                                                            type="button"

                                                            disabled={
                                                                processingId ===
                                                                request.id
                                                            }

                                                            onClick={() =>
                                                                updateRequestStatus(
                                                                    request.id,
                                                                    "rejected"
                                                                )
                                                            }

                                                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >

                                                            Odbij

                                                        </button>

                                                    </div>

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