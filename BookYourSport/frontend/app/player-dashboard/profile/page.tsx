"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlayerHeader from "../PlayerHeader";

interface User {
    firstName: string;
    lastName: string;
    email: string;
    city: string;
    dateOfBirth: string;
    role: string;
}

interface ProfileForm {
    firstName: string;
    lastName: string;
    city: string;
    dateOfBirth: string;
}

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] =
        useState<User | null>(null);

    const [form, setForm] =
        useState<ProfileForm>({
            firstName: "",
            lastName: "",
            city: "",
            dateOfBirth: "",
        });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        const accessToken =
            localStorage.getItem("accessToken");

        const savedUser =
            localStorage.getItem("user");

        if (!accessToken || !savedUser) {
            router.push("/login");
            return;
        }

        try {
            const parsedUser =
                JSON.parse(savedUser);

            setUser(parsedUser);

            setForm({
                firstName:
                    parsedUser.firstName || "",
                lastName:
                    parsedUser.lastName || "",
                city:
                    parsedUser.city || "",
                dateOfBirth:
                    parsedUser.dateOfBirth || "",
            });
        } catch (error) {
            console.error(
                "Greška prilikom učitavanja korisnika:",
                error
            );

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            localStorage.removeItem(
                "user"
            );

            router.push("/login");
        } finally {
            setLoading(false);
        }
    }, [router]);

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement
        >
    ) {
        const {
            name,
            value,
        } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setSaving(true);

        const accessToken =
            localStorage.getItem(
                "accessToken"
            );

        if (!accessToken) {
            router.push("/login");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/me`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${accessToken}`,
                    },

                    body: JSON.stringify({
                        firstName:
                        form.firstName,

                        lastName:
                        form.lastName,

                        city:
                        form.city,

                        dateOfBirth:
                        form.dateOfBirth,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Došlo je do greške prilikom čuvanja podataka."
                );

                return;
            }

            // Backend vraća ažuriranog korisnika.
            const updatedUser: User = {
                firstName:
                data.firstName,

                lastName:
                data.lastName,

                email:
                    data.email ||
                    user?.email ||
                    "",

                city:
                data.city,

                dateOfBirth:
                data.dateOfBirth,

                role:
                    data.role ||
                    user?.role ||
                    "Player",
            };

            // Ažuriramo React state.
            setUser(updatedUser);

            // Ažuriramo localStorage,
            // da se Header i Dashboard odmah osveže.
            localStorage.setItem(
                "user",
                JSON.stringify(
                    updatedUser
                )
            );

            // Obaveštavamo Header da su se
            // podaci korisnika promenili.
            window.dispatchEvent(
                new Event("auth-change")
            );

            setSuccess(
                "Lični podaci su uspešno sačuvani."
            );
        } catch (error) {
            console.error(
                "Greška prilikom izmene profila:",
                error
            );

            setError(
                "Greška pri povezivanju sa serverom."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
                <p className="text-zinc-500">
                    Učitavanje...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <PlayerHeader />

            <section className="mx-auto w-full max-w-3xl px-6 py-10">

                <Link
                    href="/player-dashboard"
                    className="mb-6 inline-block text-sm font-semibold text-green-800 transition hover:text-green-950"
                >
                    ← Nazad na moj nalog
                </Link>

                <div className="rounded-xl border border-zinc-200 bg-white">

                    <div className="border-b border-zinc-200 px-6 py-5">

                        <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                            MOJ NALOG
                        </span>

                        <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                            Izmeni lične podatke
                        </h1>

                        <p className="mt-3 text-sm text-zinc-500">
                            Možeš izmeniti svoje ime,
                            prezime, grad i datum rođenja.
                        </p>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 px-6 py-6"
                    >

                        {/* IME */}
                        <div>

                            <label
                                htmlFor="firstName"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Ime
                            </label>

                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                                maxLength={50}
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />

                        </div>


                        {/* PREZIME */}
                        <div>

                            <label
                                htmlFor="lastName"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Prezime
                            </label>

                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                                maxLength={50}
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />

                        </div>


                        {/* GRAD */}
                        <div>

                            <label
                                htmlFor="city"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Grad
                            </label>

                            <input
                                id="city"
                                name="city"
                                type="text"
                                value={form.city}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />

                        </div>


                        {/* DATUM RODJENJA */}
                        <div>

                            <label
                                htmlFor="dateOfBirth"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Datum rođenja
                            </label>

                            <input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />

                        </div>


                        {/* EMAIL - SAMO PRIKAZ */}
                        <div>

                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={
                                    user?.email || ""
                                }
                                readOnly
                                className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                            />

                            <p className="mt-2 text-xs text-zinc-500">
                                Email nije moguće menjati.
                            </p>

                        </div>


                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                {success}
                            </div>
                        )}


                        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row">

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Čuvanje..."
                                    : "Sačuvaj izmene"}
                            </button>

                            <Link
                                href="/player-dashboard"
                                className="rounded-lg border border-zinc-300 px-6 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                            >
                                Otkaži
                            </Link>

                        </div>

                    </form>

                </div>

            </section>
        </main>
    );
}