"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LoginForm = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [form, setForm] = useState<LoginForm>({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            // ==========================================
            // LOGIN
            // ==========================================

            const loginResponse = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const loginData =
                await loginResponse.json();

            if (!loginResponse.ok) {
                setError(
                    loginData.message ||
                    "Pogrešan email ili lozinka."
                );

                return;
            }

            // ==========================================
            // CUVANJE TOKENA
            // ==========================================

            localStorage.setItem(
                "accessToken",
                loginData.accessToken
            );

            localStorage.setItem(
                "refreshToken",
                loginData.refreshToken
            );

            // ==========================================
            // DOHVATAMO STVARNOG USERA
            // ==========================================

            const userResponse = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/me`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${loginData.accessToken}`,
                    },
                }
            );

            if (!userResponse.ok) {
                localStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "refreshToken"
                );

                throw new Error(
                    "Nije moguće učitati podatke korisnika."
                );
            }

            const userData =
                await userResponse.json();

            // ==========================================
            // CUVANJE USERA
            // ==========================================

            localStorage.setItem(
                "user",
                JSON.stringify(userData)
            );

            localStorage.setItem(
                "firstName",
                userData.firstName
            );

            // Obaveštavamo Header.
            window.dispatchEvent(
                new Event("auth-change")
            );

            // ==========================================
            // REDIRECT
            // ==========================================

            router.push(
                "/player-dashboard"
            );

        } catch (error) {
            console.error(error);

            setError(
                "Greška pri povezivanju sa serverom."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100 px-6 py-8">
            <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">

                <Link
                    href="/"
                    className="mb-5 flex justify-center"
                >
                    <Image
                        src="/logo.png"
                        alt="BookYourSport"
                        width={180}
                        height={100}
                        priority
                        className="h-auto w-[180px] object-contain"
                    />
                </Link>

                <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-xl shadow-green-900/10">

                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-zinc-900">
                            Dobrodošao nazad
                        </h1>

                        <p className="mt-2 text-sm text-zinc-500">
                            Prijavi se i nastavi sa rezervacijom svojih termina.
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
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Email

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
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
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-semibold text-zinc-700"
                            >
                                Lozinka

                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Unesi svoju lozinku"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Prijavljivanje..."
                                : "Prijavi se"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-zinc-600">
                        Nemaš nalog?{" "}

                        <Link
                            href="/register"
                            className="font-semibold text-green-700 transition hover:text-green-900 hover:underline"
                        >
                            Registruj se
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-sm text-zinc-500">
                    © 2026 BookYourSport
                </p>
            </div>
        </main>
    );
}