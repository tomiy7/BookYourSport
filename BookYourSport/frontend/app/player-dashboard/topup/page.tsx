"use client";

import Link from "next/link";
import PlayerHeader from "../PlayerHeader";

export default function TopUpPage() {
    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-3xl px-6 py-10">
                <Link
                    href="/player-dashboard"
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
                        Ovde ćeš moći da dodaš kredit na svoj BookYourSport
                        račun.
                    </p>

                    <div className="mt-8 rounded-xl border border-green-100 bg-green-50 p-6">
                        <p className="text-sm text-zinc-600">
                            Trenutno stanje
                        </p>

                        <p className="mt-2 text-3xl font-bold text-zinc-800">
                            0,00 RSD
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
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                        />
                    </div>

                    <button
                        type="button"
                        className="mt-6 w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
                    >
                        Nastavi na plaćanje
                    </button>
                </div>
            </section>
        </main>
    );
}