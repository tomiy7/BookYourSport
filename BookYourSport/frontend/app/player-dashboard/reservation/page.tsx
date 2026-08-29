import Link from "next/link";
import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";

export default function ReservationPage() {
    return (
        <main className="flex min-h-screen flex-col bg-zinc-50">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
                <div className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">
                            Moj nalog
                        </p>

                        <h1 className="text-3xl font-bold text-zinc-900">
                            Moje rezervacije
                        </h1>

                        <p className="mt-3 text-zinc-600">
                            Pregled predstojećih i prethodnih rezervacija.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                        Pronađi teren
                    </Link>
                </div>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold text-zinc-900">
                        Aktivne rezervacije
                    </h2>

                    <div className="mt-5 rounded-xl border border-zinc-200 bg-white">
                        <div className="px-6 py-10 text-center">
                            <p className="text-zinc-600">
                                Trenutno nemaš aktivnih rezervacija.
                            </p>

                            <Link
                                href="/"
                                className="mt-5 inline-block text-sm font-semibold text-green-700 hover:underline"
                            >
                                Pronađi slobodan termin
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="text-xl font-semibold text-zinc-900">
                        Istorija rezervacija
                    </h2>

                    <div className="mt-5 rounded-xl border border-zinc-200 bg-white">
                        <div className="px-6 py-10 text-center">
                            <p className="text-zinc-600">
                                Još uvek nemaš prethodnih rezervacija.
                            </p>
                        </div>
                    </div>
                </section>
            </section>

            <Footer />
        </main>
    );
}