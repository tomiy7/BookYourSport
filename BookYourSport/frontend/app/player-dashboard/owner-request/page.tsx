"use client";

import { useState } from "react";
import PlayerHeader from "../PlayerHeader";
import Footer from "../../Footer";

export default function OwnerRequestPage() {
    const [clubName, setClubName] = useState("");
    const [city, setCity] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setMessage(
            "Tvoj zahtev je uspešno pripremljen za slanje."
        );
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
                        Ako upravljaš teniskim klubom, možeš poslati
                        zahtev za Club Owner nalog i nakon odobrenja
                        upravljati svojim terenima i rezervacijama.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8"
                >
                    {message && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            {message}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label
                                htmlFor="clubName"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Naziv kluba
                            </label>

                            <input
                                id="clubName"
                                type="text"
                                value={clubName}
                                onChange={(e) =>
                                    setClubName(e.target.value)
                                }
                                required
                                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="city"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Grad
                            </label>

                            <input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) =>
                                    setCity(e.target.value)
                                }
                                required
                                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Dodatne informacije
                            </label>

                            <textarea
                                id="description"
                                rows={5}
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target.value
                                    )
                                }
                                placeholder="Opiši klub i svoju ulogu."
                                className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
                        >
                            Pošalji zahtev
                        </button>
                    </div>
                </form>
            </section>

            <Footer />
        </main>
    );
}