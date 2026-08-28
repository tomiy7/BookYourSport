"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegisterForm = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    city: string;
    dateOfBirth: string;
};

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState<RegisterForm>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        city: "",
        dateOfBirth: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Lozinke se ne poklapaju.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        firstName: form.firstName,
                        lastName: form.lastName,
                        email: form.email,
                        password: form.password,
                        city: form.city,
                        dateOfBirth: form.dateOfBirth,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.message || "Registracija nije uspela."
                );
                return;
            }

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            window.dispatchEvent(new Event("auth-change"));

            router.push("/");
        } catch {
            setError("Greška pri povezivanju sa serverom.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100 px-6 py-12">
            <div className="mx-auto flex w-full max-w-2xl flex-col">
                <Link
                    href="/"
                    className="mb-8 text-center text-3xl font-extrabold tracking-tight text-green-900"
                >
                    BookYourSport
                </Link>

                <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-xl shadow-green-900/10 sm:p-10">
                    <div className="mb-8 text-center">
                        <div className="mb-4 text-4xl">🎾</div>

                        <h1 className="text-3xl font-bold text-zinc-900">
                            Kreiraj svoj nalog
                        </h1>

                        <p className="mt-2 text-sm text-zinc-500">
                            Registruj se i pronađi svoj sledeći teniski teren.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5"
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Ime
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    maxLength={50}
                                    required
                                    placeholder="Unesi ime"
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Prezime
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    maxLength={50}
                                    required
                                    placeholder="Unesi prezime"
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Email
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                maxLength={255}
                                required
                                placeholder="Unesi svoj email"
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Lozinka
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                    placeholder="Najmanje 8 karaktera"
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />

                                <p className="mt-2 text-xs text-zinc-500">
                                    Lozinka mora imati najmanje 8 karaktera.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Potvrdi lozinku
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                    placeholder="Ponovi lozinku"
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="city"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Grad
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={form.city}
                                    onChange={handleChange}
                                    maxLength={100}
                                    required
                                    placeholder="Na primer, Beograd"
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="dateOfBirth"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Datum rođenja
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Registrujem..." : "Registruj se"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-zinc-600">
                        Već imaš nalog?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-green-700 transition hover:text-green-900 hover:underline"
                        >
                            Prijavi se
                        </Link>
                    </p>
                </div>

                <p className="mt-8 pb-4 text-center text-sm text-zinc-500">
                    © 2026 BookYourSport
                </p>
            </div>
        </main>
    );
}