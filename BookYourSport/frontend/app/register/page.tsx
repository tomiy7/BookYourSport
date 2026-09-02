"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterForm = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    city: string;
    dateOfBirth: string;
};

type FieldErrors = {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    city?: string;
    dateOfBirth?: string;
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

    const [fieldErrors, setFieldErrors] =
        useState<FieldErrors>({});

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] =
        useState(false);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const { name, value } = e.target;

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

    function validateForm(): boolean {
        const errors: FieldErrors = {};

        if (!form.firstName.trim()) {
            errors.firstName = "Ime je obavezno.";
        }

        if (!form.lastName.trim()) {
            errors.lastName = "Prezime je obavezno.";
        }

        if (!form.email.trim()) {
            errors.email = "Email je obavezan.";
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
        } else if (form.password.length < 8) {
            errors.password =
                "Lozinka mora imati najmanje 8 karaktera.";
        }

        if (!form.confirmPassword) {
            errors.confirmPassword =
                "Potvrda lozinke je obavezna.";
        } else if (
            form.password !== form.confirmPassword
        ) {
            errors.confirmPassword =
                "Lozinke se ne podudaraju.";
        }

        if (!form.city.trim()) {
            errors.city = "Grad je obavezan.";
        }

        if (!form.dateOfBirth) {
            errors.dateOfBirth =
                "Datum rođenja je obavezan.";
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    }

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
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        firstName:
                        form.firstName,
                        lastName:
                        form.lastName,
                        email: form.email,
                        password:
                        form.password,
                        city: form.city,
                        dateOfBirth:
                        form.dateOfBirth,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                const backendMessage =
                    data.message ||
                    data.detail;

                let message =
                    "Došlo je do greške prilikom registracije.";

                if (
                    backendMessage?.toLowerCase() ===
                    "email already exists"
                ) {
                    message = "Email već postoji.";
                } else if (backendMessage) {
                    message = backendMessage;
                }

                setError(message);
                return;
            }

            // Registracija je uspešna.
            // Ne prijavljujemo korisnika automatski.
            // Korisnik će se prijaviti preko Login stranice.
            setRegistrationSuccess(true);
        } catch {
            setError(
                "Greška pri povezivanju sa serverom."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100 px-6 py-12">
            <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg flex-col justify-center">

                {/* LOGO */}
                <Link
                    href="/"
                    className="mb-8 flex justify-center"
                >
                    <Image
                        src="/logo.png"
                        alt="BookYourSport"
                        width={170}
                        height={65}
                        priority
                        className="h-auto w-[150px] object-contain"
                    />
                </Link>

                {/* REGISTER CARD */}
                <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-xl shadow-green-900/10">

                    <div className="mb-8 text-center">
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
                        noValidate
                        className="flex flex-col gap-5"
                    >

                        {/* IME I PREZIME */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            {/* IME */}
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Ime
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Unesi ime"
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.firstName
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.firstName && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.firstName}
                                    </p>
                                )}
                            </div>

                            {/* PREZIME */}
                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Prezime
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Unesi prezime"
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.lastName
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.lastName && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

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
                                onChange={handleChange}
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

                        {/* LOZINKE */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            {/* LOZINKA */}
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
                                    placeholder="Unesi lozinku"
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.password
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.password ? (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.password}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-xs text-zinc-500">
                                        Lozinka mora imati najmanje 8 karaktera.
                                    </p>
                                )}
                            </div>

                            {/* POTVRDA LOZINKE */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Potvrdi lozinku
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Ponovi lozinku"
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.confirmPassword
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.confirmPassword && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* GRAD I DATUM RODJENJA */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            {/* GRAD */}
                            <div>
                                <label
                                    htmlFor="city"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Grad
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={form.city}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Unesi grad"
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.city
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.city && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.city}
                                    </p>
                                )}
                            </div>

                            {/* DATUM RODJENJA */}
                            <div>
                                <label
                                    htmlFor="dateOfBirth"
                                    className="mb-2 block text-sm font-semibold text-zinc-700"
                                >
                                    Datum rođenja
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border px-4 py-3 text-zinc-900 outline-none transition focus:ring-4 ${
                                        fieldErrors.dateOfBirth
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                            : "border-zinc-200 bg-white focus:border-green-600 focus:ring-green-100"
                                    }`}
                                />

                                {fieldErrors.dateOfBirth && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {fieldErrors.dateOfBirth}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Registrovanje..."
                                : "Registruj se"}
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

                <p className="mt-8 text-center text-sm text-zinc-500">
                    © 2026 BookYourSport
                </p>

            </div>

            {/* SUCCESS POPUP */}
            {registrationSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">

                        {/* SUCCESS ICON */}
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <span className="text-3xl text-green-700">
                                ✓
                            </span>
                        </div>

                        <h2 className="mt-6 text-2xl font-bold text-zinc-900">
                            Uspešna registracija!
                        </h2>

                        <p className="mt-3 leading-6 text-zinc-600">
                            Tvoj nalog je uspešno kreiran.
                            <br />
                            Sada možeš da se prijaviš na svoj nalog.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/login")
                            }
                            className="mt-7 w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800"
                        >
                            Prijavi se
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/")
                            }
                            className="mt-3 w-full rounded-xl border border-zinc-300 bg-white py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100"
                        >
                            Nazad na početnu
                        </button>

                    </div>

                </div>
            )}

        </main>
    );
}