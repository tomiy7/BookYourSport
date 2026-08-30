"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";
import { getAccessToken } from "@/lib/auth";
import {
    getBalance,
    getTransactions,
    WalletTransaction,
} from "@/lib/paymentApi";

function formatPrice(amount: number, currency = "RSD") {
    return new Intl.NumberFormat("sr-Latn-RS", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("sr-Latn-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function transactionLabel(type: string) {
    switch (type) {
        case "TopUp":
            return "Uplata kredita";
        case "ReservationCharge":
            return "Plaćanje rezervacije";
        case "Refund":
            return "Povraćaj sredstava";
        default:
            return type;
    }
}

function isIncoming(type: string) {
    return type === "TopUp" || type === "Refund";
}

export default function WalletPage() {
    const router = useRouter();

    const [balance, setBalance] = useState(0);
    const [currency, setCurrency] = useState("RSD");
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        loadWallet(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadWallet(token: string) {
        try {
            setLoading(true);
            setError("");

            const [wallet, history] = await Promise.all([
                getBalance(token),
                getTransactions(token),
            ]);

            setBalance(wallet.balance);
            setCurrency(wallet.currency);
            setTransactions(history);
        } catch {
            setError("Nije moguće učitati podatke o računu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">
                        Moj nalog
                    </p>

                    <h1 className="text-3xl font-bold text-zinc-900">
                        Stanje na računu
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Pregled dostupnog kredita i svih transakcija.
                    </p>
                </div>

                <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-xl border border-zinc-200 bg-white p-7">
                        <p className="text-sm text-zinc-500">Dostupan kredit</p>

                        <p className="mt-4 text-4xl font-bold text-zinc-900">
                            {loading ? "Učitavanje..." : formatPrice(balance, currency)}
                        </p>

                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Kredit možeš koristiti za plaćanje rezervacija na
                            platformi.
                        </p>

                        <Link
                            href="/player-dashboard/topup"
                            className="mt-7 block rounded-lg bg-green-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-800"
                        >
                            Dodaj kredit
                        </Link>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white">
                        <div className="border-b border-zinc-200 px-6 py-5">
                            <h2 className="text-xl font-semibold text-zinc-900">
                                Istorija transakcija
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Sve promene na tvom računu.
                            </p>
                        </div>

                        {error && (
                            <div className="px-6 py-4 text-sm text-red-600">{error}</div>
                        )}

                        {!error && !loading && transactions.length === 0 && (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-zinc-500">
                                    Trenutno nema transakcija.
                                </p>
                            </div>
                        )}

                        {!error && transactions.length > 0 && (
                            <div className="divide-y divide-zinc-100">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between px-6 py-4"
                                    >
                                        <div>
                                            <p className="font-semibold text-zinc-900">
                                                {transactionLabel(transaction.type)}
                                            </p>

                                            <p className="mt-1 text-sm text-zinc-500">
                                                {formatDateTime(transaction.createdAt)}
                                            </p>
                                        </div>

                                        <span
                                            className={
                                                isIncoming(transaction.type)
                                                    ? "font-semibold text-green-700"
                                                    : "font-semibold text-red-600"
                                            }
                                        >
                                            {isIncoming(transaction.type) ? "+" : "-"}
                                            {formatPrice(transaction.amount, currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}