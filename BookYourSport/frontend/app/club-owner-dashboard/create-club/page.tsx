"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "../ClubOwnerHeader";
import { getAccessToken } from "@/lib/auth";
import {
    createClub,
    type CreateClubPayload,
    type CreateWorkingHoursPayload,
} from "@/lib/reservationApi";

const inputClass =
    "w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

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

type DayWorkingHours = {
    dayOfWeek: number; // System.DayOfWeek na backendu: Sunday=0 ... Saturday=6
    label: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
};

const initialWorkingHours: DayWorkingHours[] = [
    { dayOfWeek: 1, label: "Ponedeljak", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, label: "Utorak", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 3, label: "Sreda", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 4, label: "Četvrtak", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 5, label: "Petak", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 6, label: "Subota", openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 0, label: "Nedelja", openTime: "07:00", closeTime: "22:00", isClosed: false },
];

export default function CreateClubPage() {
    const router = useRouter();

    const [form, setForm] = useState<CreateClubPayload>(initialForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [workingHours, setWorkingHours] = useState<DayWorkingHours[]>(
        initialWorkingHours
    );

    function updateDay(
        dayOfWeek: number,
        field: "openTime" | "closeTime" | "isClosed",
        value: string | boolean
    ) {
        setWorkingHours((current) =>
            current.map((day) =>
                day.dayOfWeek === dayOfWeek
                    ? { ...day, [field]: value }
                    : day
            )
        );
    }

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

        // Validacija - zatvaranje mora biti posle otvaranja, za svaki
        // dan koji nije oznacen kao zatvoren. Backend ima istu proveru
        // (TennisClub.SetWorkingHours), ovo je samo brz feedback.
        for (const day of workingHours) {
            if (!day.isClosed && day.closeTime <= day.openTime) {
                setError(
                    `${day.label}: vreme zatvaranja mora biti posle vremena otvaranja.`
                );
                return;
            }
        }

        setLoading(true);

        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        const workingHoursPayload: CreateWorkingHoursPayload[] =
            workingHours.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                openTime: `${day.openTime}:00`,
                closeTime: `${day.closeTime}:00`,
                isClosed: day.isClosed,
            }));

        try {
            await createClub(
                { ...form, workingHours: workingHoursPayload }
            );
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

    function applyToAllDays() {
        const template = workingHours[0];
        setWorkingHours((current) =>
            current.map((day) => ({
                ...day,
                openTime: template.openTime,
                closeTime: template.closeTime,
            }))
        );
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
                        Unesi osnovne podatke o klubu i radno vreme.
                        Terene možeš dodati odmah posle.
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
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Opis">
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Telefon">
                                <input
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Email kluba">
                                <input
                                    name="emailAddress"
                                    type="email"
                                    value={form.emailAddress}
                                    onChange={handleChange}
                                    className={inputClass}
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
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Opština">
                                <input
                                    name="municipality"
                                    value={form.municipality}
                                    onChange={handleChange}
                                    className={inputClass}
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
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Broj" required>
                                <input
                                    name="streetNumber"
                                    value={form.streetNumber}
                                    onChange={handleChange}
                                    required
                                    maxLength={20}
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Poštanski broj">
                                <input
                                    name="zipCode"
                                    value={form.zipCode}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Država" required>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <div className="border-t border-zinc-200 pt-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-700">
                                        Radno vreme
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Podesi radno vreme po danu.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={applyToAllDays}
                                    className="text-sm font-semibold text-green-700 underline transition hover:text-green-900"
                                >
                                    Primeni na sve dane
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-zinc-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Dan</th>
                                        <th className="px-4 py-2 font-medium text-center">
                                            Zatvoreno
                                        </th>
                                        <th className="px-4 py-2 font-medium">Otvara</th>
                                        <th className="px-4 py-2 font-medium">Zatvara</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {workingHours.map((day, index) => (
                                        <tr
                                            key={day.dayOfWeek}
                                            className={
                                                index !== workingHours.length - 1
                                                    ? "border-b border-zinc-100"
                                                    : ""
                                            }
                                        >
                                            <td className="px-4 py-2 font-medium text-zinc-700">
                                                {day.label}
                                            </td>

                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={day.isClosed}
                                                    onChange={(e) =>
                                                        updateDay(
                                                            day.dayOfWeek,
                                                            "isClosed",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="h-4 w-4"
                                                />
                                            </td>

                                            <td className="px-4 py-2">
                                                <input
                                                    type="time"
                                                    step="3600"
                                                    disabled={day.isClosed}
                                                    value={day.openTime}
                                                    onChange={(e) =>
                                                        updateDay(
                                                            day.dayOfWeek,
                                                            "openTime",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none disabled:bg-zinc-50 disabled:text-zinc-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                                />
                                            </td>

                                            <td className="px-4 py-2">
                                                <input
                                                    type="time"
                                                    step="3600"
                                                    disabled={day.isClosed}
                                                    value={day.closeTime}
                                                    onChange={(e) =>
                                                        updateDay(
                                                            day.dayOfWeek,
                                                            "closeTime",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none disabled:bg-zinc-50 disabled:text-zinc-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
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