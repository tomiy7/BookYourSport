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
        <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-sm flex-col gap-4"
            >
                <h1 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">
                    Registracija
                </h1>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <div>
                    <label
                        htmlFor="firstName"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Ime <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={handleChange}
                        maxLength={50}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="lastName"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Prezime <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={handleChange}
                        maxLength={50}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Email <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        maxLength={255}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Lozinka <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />

                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Lozinka mora imati najmanje 8 karaktera.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Potvrdi lozinku{" "}
                        <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        minLength={8}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="city"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Grad <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="dateOfBirth"
                        className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
                    >
                        Datum rođenja{" "}
                        <span className="text-red-600">*</span>
                    </label>

                    <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-black py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                    {loading ? "Registrujem..." : "Registruj se"}
                </button>

                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Već imaš nalog?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-black underline dark:text-white"
                    >
                        Prijavi se
                    </Link>
                </p>
            </form>
        </div>
    );
}