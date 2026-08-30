"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PlayerHeader from "../PlayerHeader";
import { getAccessToken } from "@/lib/auth";
import { getBalance, topUp } from "@/lib/paymentApi";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

function formatPrice(amount: number, currency = "RSD") {
    return new Intl.NumberFormat("sr-Latn-RS", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

export default function TopUpPage() {
    const router = useRouter();

    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState("RSD");
    const [amount, setAmount] = useState("");
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        loadBalance(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadBalance(token: string) {
        try {
            setLoadingBalance(true);
            const wallet = await getBalance(token);
            setBalance(wallet.balance);
            setCurrency(wallet.currency);
        } catch {
            setError("Nije moguće učitati trenutno stanje.");
        } finally {
            setLoadingBalance(false);
        }
    }

    async function handleSubmit() {
        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        const numericAmount = Number(amount);

        setError("");
        setSuccess("");

        if (!numericAmount || numericAmount < 100) {
            setError("Unesi iznos od najmanje 100 RSD.");
            return;
        }

        try {
            setSubmitting(true);

            const wallet = await topUp(numericAmount, token, currency);

            setBalance(wallet.balance);
            setSuccess(
                `Uspešno si dopunio/la stanje za ${formatPrice(numericAmount, currency)}.`
            );
            setAmount("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Uplata nije uspela. Pokušaj ponovo."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-3xl px-6 py-10">
                <Link
                    href="/player-dashboard/wallet"
                    className="text-sm font-semibold text-green-800 transition hover:text-green-950"
                >
                    ← Nazad na moj nalog
                </Link>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8">
                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        STANJE NA RAČUNU
                    </span>

                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        Dodaj kredit
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Dopuni stanje da bi mogao/la da rezervišeš termine na
                        BookYourSport platformi.
                    </p>

                    <div className="mt-8 rounded-xl border border-green-100 bg-green-50 p-6">
                        <p className="text-sm text-zinc-600">Trenutno stanje</p>

                        <p className="mt-2 text-3xl font-bold text-zinc-800">
                            {loadingBalance
                                ? "Učitavanje..."
                                : formatPrice(balance ?? 0, currency)}
                        </p>
                    </div>

                    <div className="mt-6">
                        <label
                            htmlFor="amount"
                            className="mb-2 block text-sm font-semibold text-zinc-700"
                        >
                            Iznos kredita
                        </label>

                        <input
                            id="amount"
                            type="number"
                            min="100"
                            placeholder="Unesi iznos"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                            {QUICK_AMOUNTS.map((quickAmount) => (
                                <button
                                    key={quickAmount}
                                    type="button"
                                    onClick={() => setAmount(String(quickAmount))}
                                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-green-600 hover:text-green-700"
                                >
                                    {formatPrice(quickAmount, currency)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="mt-6 w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Uplata u toku..." : "Nastavi na plaćanje"}
                    </button>
                </div>
            </section>
        </main>
    );
}