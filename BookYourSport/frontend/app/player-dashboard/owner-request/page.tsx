"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";
import { getAccessToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function OwnerRequestPage() {
    const router = useRouter();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit() {
        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const response = await apiFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/request-club-ownership`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {
                let errorMessage =
                    "Slanje zahteva nije uspelo. Pokušaj ponovo.";

                try {
                    const data = await response.json();

                    errorMessage =
                        data.detail ||
                        data.message ||
                        data.title ||
                        errorMessage;
                } catch {
                    // Ako backend ne vrati JSON,
                    // ostavljamo podrazumevanu poruku.
                }

                throw new Error(errorMessage);
            }

            setSuccess(true);
            setMessage(
                "Tvoj zahtev za Club Owner nalog je uspešno poslat. Administrator će ga pregledati."
            );
        } catch (err) {
            setSuccess(false);

            setError(
                err instanceof Error
                    ? err.message
                    : "Slanje zahteva nije uspelo. Pokušaj ponovo."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">
                        Club Owner
                    </p>

                    <h1 className="text-3xl font-bold text-zinc-900">
                        Zatraži Club Owner nalog
                    </h1>

                    <p className="mt-3 leading-6 text-zinc-600">
                        Ako upravljaš sportskim klubom, možeš poslati zahtev
                        za Club Owner nalog. Nakon što administrator pregleda
                        i odobri zahtev, nastavićeš proces aktivacije Club
                        Owner naloga.
                    </p>
                </div>

                <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
                    {message && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            {error}
                        </div>
                    )}

                    {!success && (
                        <>
                            <div className="rounded-lg bg-zinc-50 p-5">
                                <h2 className="font-semibold text-zinc-900">
                                    Šta se dešava nakon slanja zahteva?
                                </h2>

                                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                                    <p>
                                        1. Tvoj zahtev će biti evidentiran na
                                        platformi.
                                    </p>

                                    <p>
                                        2. Administrator će pregledati zahtev
                                        i odlučiti da li će biti odobren.
                                    </p>

                                    <p>
                                        3. Nakon odobrenja nastavljaš proces
                                        aktivacije svog Club Owner naloga.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="mt-6 w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Slanje zahteva..."
                                    : "Pošalji zahtev"}
                            </button>
                        </>
                    )}

                    <Link
                        href="/player-dashboard"
                        className="mt-5 block text-center text-sm font-semibold text-green-700 transition hover:text-green-800"
                    >
                        ← Nazad na moj nalog
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}