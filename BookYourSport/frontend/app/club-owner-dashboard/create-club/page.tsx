"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "../ClubOwnerHeader";
import { getAccessToken } from "@/lib/auth";
import { createClub, type CreateClubPayload } from "@/lib/reservationApi";

const initialForm: CreateClubPayload = {
    name: "",
    description: "",
    phoneNumber: "",
    emailAddress: "",
    city: "",
    municipality: "",
    zipCode: "",
    street: "",
    country: "Srbija",
    streetNumber: "",
};

export default function CreateClubPage() {
    const router = useRouter();

    const [form, setForm] = useState<CreateClubPayload>(initialForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            await createClub(form, token);
            router.push("/club-owner-dashboard");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Kreiranje kluba nije uspelo."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <ClubOwnerHeader />

            <section className="mx-auto w-full max-w-2xl px-6 py-12">
                <div className="mb-8">
                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        MOJ KLUB
                    </span>

                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        Napravi svoj klub
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Unesi osnovne podatke o klubu. Terene možeš
                        dodati odmah posle.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8"
                >
                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <Field label="Naziv kluba" required>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                        </Field>

                        <Field label="Opis">
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Telefon">
                                <input
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>

                            <Field label="Email kluba">
                                <input
                                    name="emailAddress"
                                    type="email"
                                    value={form.emailAddress}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Grad" required>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>

                            <Field label="Opština">
                                <input
                                    name="municipality"
                                    value={form.municipality}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[2fr_1fr]">
                            <Field label="Ulica" required>
                                <input
                                    name="street"
                                    value={form.street}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>

                            <Field label="Broj" required>
                                <input
                                    name="streetNumber"
                                    value={form.streetNumber}
                                    onChange={handleChange}
                                    required
                                    maxLength={20}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Poštanski broj">
                                <input
                                    name="zipCode"
                                    value={form.zipCode}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>

                            <Field label="Država" required>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                />
                            </Field>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Čuvanje..." : "Napravi klub"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

function Field({
                   label,
                   required,
                   children,
               }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                {label}
                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>
            {children}
        </div>
    );
}
