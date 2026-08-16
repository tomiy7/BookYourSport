"use client";

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

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.message || "Pogrešan email ili lozinka."
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
                    Prijava
                </h1>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

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
                        required
                        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 rounded-full bg-black py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                    {loading ? "Prijavljujem..." : "Prijavi se"}
                </button>

                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Nemaš nalog?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-black underline dark:text-white"
                    >
                        Registruj se
                    </Link>
                </p>
            </form>
        </div>
    );
}