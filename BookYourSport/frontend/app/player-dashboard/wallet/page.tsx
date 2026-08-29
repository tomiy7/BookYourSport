import Link from "next/link";
import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";

export default function WalletPage() {
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
                        <p className="text-sm text-zinc-500">
                            Dostupan kredit
                        </p>

                        <p className="mt-4 text-4xl font-bold text-zinc-900">
                            0,00 RSD
                        </p>

                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Kredit možeš koristiti za plaćanje rezervacija
                            na platformi.
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

                        <div className="px-6 py-10 text-center">
                            <p className="text-sm text-zinc-500">
                                Trenutno nema transakcija.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}