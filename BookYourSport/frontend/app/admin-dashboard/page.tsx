import Link from "next/link";

import AdminHeader from "./AdminHeader";
import Footer from "../Footer";

export default function AdminDashboardPage() {
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
                        Admin Dashboard
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Upravljaj korisnicima, Club Owner zahtevima i
                        statusima naloga na platformi.
                    </p>
                </div>


                {/* KARTICE */}

                <div className="mt-10 grid gap-6 md:grid-cols-2">


                    {/* CLUB OWNER ZAHTEVI */}

                    <Link
                        href="/admin-dashboard/owner-requests"
                        className="group rounded-xl border border-zinc-200 bg-white p-7 transition hover:border-green-300 hover:shadow-sm"
                    >
                        <div className="flex items-start justify-between">

                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">
                                    Club Owner zahtevi
                                </h2>

                                <p className="mt-3 leading-6 text-zinc-600">
                                    Pregledaj zahteve korisnika koji žele
                                    Club Owner nalog i odobri ili odbij
                                    zahteve koji čekaju pregled.
                                </p>
                            </div>

                            <span className="text-2xl transition group-hover:translate-x-1">
                                →
                            </span>

                        </div>

                        <p className="mt-6 text-sm font-semibold text-green-700">
                            Pregledaj zahteve →
                        </p>
                    </Link>


                    {/* KORISNICI */}

                    <Link
                        href="/admin-dashboard/users"
                        className="group rounded-xl border border-zinc-200 bg-white p-7 transition hover:border-green-300 hover:shadow-sm"
                    >
                        <div className="flex items-start justify-between">

                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">
                                    Korisnici
                                </h2>

                                <p className="mt-3 leading-6 text-zinc-600">
                                    Pregledaj sve korisnike platforme,
                                    njihove role i trenutne statuse
                                    odobrenja naloga.
                                </p>
                            </div>

                            <span className="text-2xl transition group-hover:translate-x-1">
                                →
                            </span>

                        </div>

                        <p className="mt-6 text-sm font-semibold text-green-700">
                            Pregledaj korisnike →
                        </p>
                    </Link>

                </div>

            </section>

            <Footer />
        </main>
    );
}