"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    getDashboardPath,
} from "@/lib/user";

import { apiFetch } from "@/lib/api";

type LoginForm = {
    email: string;
    password: string;
};

type FieldErrors = {
    email?: string;
    password?: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [form, setForm] =
        useState<LoginForm>({
            email: "",
            password: "",
        });

    const [fieldErrors, setFieldErrors] =
        useState<FieldErrors>({});

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    // ==========================================
    // INPUT CHANGE
    // ==========================================

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const {
            name,
            value,
        } = e.target;

        setForm({
            ...form,
            [name]: value,
        });

        setFieldErrors((previous) => ({
            ...previous,
            [name]: undefined,
        }));

        setError("");
    }

    // ==========================================
    // VALIDACIJA
    // ==========================================

    function validateForm(): boolean {
        const errors: FieldErrors = {};

        if (!form.email.trim()) {
            errors.email =
                "Email je obavezan.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email
            )
        ) {
            errors.email =
                "Unesite ispravnu email adresu.";
        }

        if (!form.password) {
            errors.password =
                "Lozinka je obavezna.";
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    }

    // ==========================================
    // LOGIN
    // ==========================================

    async function handleSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        setError("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // ==========================================
            // LOGIN
            // ==========================================

            const loginResponse =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify(
                            form
                        ),
                    }
                );

            let loginData;

            try {
                loginData =
                    await loginResponse.json();
            } catch {
                throw new Error(
                    "Server nije vratio ispravan odgovor."
                );
            }

            if (!loginResponse.ok) {
                const backendMessage =
                    loginData?.message ||
                    loginData?.detail;

                let message =
                    "Pogrešan email ili lozinka.";

                if (
                    backendMessage &&
                    backendMessage.toLowerCase() ===
                    "wrong email or password."
                ) {
                    message =
                        "Pogrešan email ili lozinka.";
                } else if (
                    backendMessage
                ) {
                    message =
                        backendMessage;
                }

                setError(message);

                return;
            }

            // ==========================================
            // PROVERA TOKENA
            // ==========================================

            if (!loginData?.accessToken) {
                throw new Error(
                    "Server nije vratio access token."
                );
            }

            // ==========================================
            // CUVANJE TOKENA
            // ==========================================

            localStorage.setItem(
                "accessToken",
                loginData.accessToken
            );

            if (loginData.refreshToken) {
                localStorage.setItem(
                    "refreshToken",
                    loginData.refreshToken
                );
            }

            // ==========================================
            // DOHVAT STVARNOG USERA
            //
            // Koristimo apiFetch (ne ručni fetch +
            // Authorization header). accessToken je
            // upravo sačuvan u localStorage par redova
            // iznad, pa apiFetch ima šta da pročita.
            // ==========================================

            const userResponse =
                await apiFetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
                    {
                        method: "GET",
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
            // PROVERA ROLE
            // ==========================================

            if (!userData?.role) {
                throw new Error(
                    "Korisnik nema dodeljenu ulogu."
                );
            }

            // ==========================================
            // CUVANJE USERA
            // ==========================================

            localStorage.setItem(
                "user",
                JSON.stringify(
                    userData
                )
            );

            localStorage.setItem(
                "firstName",
                userData.firstName || ""
            );

            // ==========================================
            // OBAVESTAVAMO HEADER
            // ==========================================

            window.dispatchEvent(
                new Event(
                    "auth-change"
                )
            );

            // ==========================================
            // REDIRECT NAKON LOGIN-a
            // ==========================================

            /*
             * Player nakon logina ide na homepage.
             *
             * Ostale role idu na svoj dashboard:
             * - Club Owner -> /club-owner-dashboard
             * - Admin -> /admin-dashboard
             */

            if (
                userData.role?.toLowerCase() ===
                "player"
            ) {
                router.replace("/");
            } else {
                const dashboardPath =
                    getDashboardPath(
                        userData.role
                    );

                router.replace(
                    dashboardPath
                );
            }

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            if (error instanceof Error) {
                setError(
                    error.message
                );
            } else {
                setError(
                    "Greška pri povezivanju sa serverom."
                );
            }

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100 px-6 py-8">

            <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">

                {/* ================================= */}
                {/* LOGO */}
                {/* ================================= */}

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

                {/* ================================= */}
                {/* LOGIN CARD */}
                {/* ================================= */}

                <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-xl shadow-green-900/10">

                    {/* TITLE */}

                    <div className="mb-8 text-center">

                        <h1 className="text-3xl font-bold text-zinc-900">
                            Dobrodošao nazad
                        </h1>

                        <p className="mt-2 text-sm text-zinc-500">
                            Prijavi se i nastavi na svoj nalog.
                        </p>

                    </div>

                    {/* GENERAL ERROR */}

                    {error && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* FORM */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        noValidate
                        className="flex flex-col gap-5"
                    >

                        {/* EMAIL */}

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
                                onChange={
                                    handleChange
                                }
                                maxLength={255}
                                placeholder="Unesi svoj email"
                                className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                    fieldErrors.email
                                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                        : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                }`}
                            />

                            {fieldErrors.email && (
                                <p className="mt-2 text-xs text-red-600">
                                    {fieldErrors.email}
                                </p>
                            )}

                        </div>

                        {/* PASSWORD */}

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
                                onChange={
                                    handleChange
                                }
                                placeholder="Unesi svoju lozinku"
                                className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                    fieldErrors.password
                                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                        : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                }`}
                            />

                            {fieldErrors.password && (
                                <p className="mt-2 text-xs text-red-600">
                                    {fieldErrors.password}
                                </p>
                            )}

                        </div>

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="mt-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Prijavljivanje..."
                                : "Prijavi se"}
                        </button>

                    </form>

                    {/* REGISTER */}

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