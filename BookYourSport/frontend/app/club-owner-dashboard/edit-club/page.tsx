"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "../ClubOwnerHeader";
import { getStoredUser } from "@/lib/user";
import { getAccessToken } from "@/lib/auth";
import {
    getClubs,
    updateClub,
    type Club,
    type UpdateClubPayload,
    type CreateWorkingHoursPayload,
} from "@/lib/reservationApi";

const inputClass =
    "w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

type DayWorkingHours = {
    dayOfWeek: number; // System.DayOfWeek na backendu: Sunday=0 ... Saturday=6
    label: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
};

const DAY_LABELS: Record<number, string> = {
    1: "Ponedeljak",
    2: "Utorak",
    3: "Sreda",
    4: "Četvrtak",
    5: "Petak",
    6: "Subota",
    0: "Nedelja",
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function defaultWorkingHours(): DayWorkingHours[] {
    return DAY_ORDER.map((dayOfWeek) => ({
        dayOfWeek,
        label: DAY_LABELS[dayOfWeek],
        openTime: "07:00",
        closeTime: "22:00",
        isClosed: false,
    }));
}

// "07:00:00" -> "07:00" (input type="time" ocekuje HH:mm)
function toTimeInputValue(time: string) {
    return time.slice(0, 5);
}

export default function EditClubPage() {
    const router = useRouter();

    const [club, setClub] = useState<Club | null>(null);
    const [form, setForm] = useState<UpdateClubPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [workingHours, setWorkingHours] = useState<DayWorkingHours[]>(
        defaultWorkingHours()
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

    useEffect(() => {
        const token = getAccessToken();
        const user = getStoredUser();

        if (!token || !user) {
            router.push("/login");
            return;
        }

        getClubs()
            .then((clubs) => {
                const ownClub = clubs.find(
                    (c) => c.ownerId === user.id
                );

                if (!ownClub) {
                    router.push(
                        "/club-owner-dashboard/create-club"
                    );
                    return;
                }

                setClub(ownClub);
                setForm({
                    name: ownClub.name,
                    description: ownClub.description ?? "",
                    phoneNumber: ownClub.phoneNumber ?? "",
                    emailAddress: ownClub.emailAddress ?? "",
                    city: ownClub.address.city,
                    municipality: ownClub.address.municipality ?? "",
                    zipCode: ownClub.address.zipCode ?? "",
                    street: ownClub.address.street,
                    country: ownClub.address.country,
                    streetNumber: ownClub.address.streetNumber,
                    isActive: ownClub.isActive,
                });

                // Popuni working hours po danu iz postojecih podataka kluba -
                // za dane koji jos nemaju zapis, ostaje default (07-22, otvoreno).
                const existingByDay = new Map(
                    (ownClub.workingHours ?? []).map((w) => [
                        Number(w.dayOfWeek),
                        w,
                    ])
                );

                setWorkingHours(
                    DAY_ORDER.map((dayOfWeek) => {
                        const existing = existingByDay.get(dayOfWeek);

                        if (!existing) {
                            return {
                                dayOfWeek,
                                label: DAY_LABELS[dayOfWeek],
                                openTime: "07:00",
                                closeTime: "22:00",
                                isClosed: false,
                            };
                        }

                        return {
                            dayOfWeek,
                            label: DAY_LABELS[dayOfWeek],
                            openTime: toTimeInputValue(existing.openTime),
                            closeTime: toTimeInputValue(existing.closeTime),
                            isClosed: existing.isClosed,
                        };
                    })
                );
            })
            .catch(() =>
                setError("Nije moguće učitati podatke o klubu.")
            )
            .finally(() => setLoading(false));
    }, [router]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        if (!form) return;

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!club || !form) return;

        setError("");
        setSuccess("");

        for (const day of workingHours) {
            if (!day.isClosed && day.closeTime <= day.openTime) {
                setError(
                    `${day.label}: vreme zatvaranja mora biti posle vremena otvaranja.`
                );
                return;
            }
        }

        setSaving(true);

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
            const updated = await updateClub(
                club.id,
                { ...form, workingHours: workingHoursPayload }
            );
            setClub(updated);
            setSuccess("Podaci o klubu su sačuvani.");

            setTimeout(() => {
                router.push("/club-owner-dashboard");
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Izmena kluba nije uspela."
            );
        } finally {
            setSaving(false);
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

    if (loading || !form) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
                <p className="text-zinc-500">Učitavanje...</p>
            </main>
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
                        Podaci o klubu
                    </h1>

                    <p className="mt-3 text-zinc-600">
                        Izmeni osnovne podatke, kontakt, adresu i radno
                        vreme svog kluba.
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

                    {success && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            {success}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                Naziv kluba <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                Opis
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Telefon
                                </label>
                                <input
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Email kluba
                                </label>
                                <input
                                    name="emailAddress"
                                    type="email"
                                    value={form.emailAddress}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Grad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Opština
                                </label>
                                <input
                                    name="municipality"
                                    value={form.municipality}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[2fr_1fr]">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Ulica <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="street"
                                    value={form.street}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Broj <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="streetNumber"
                                    value={form.streetNumber}
                                    onChange={handleChange}
                                    required
                                    maxLength={20}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Poštanski broj
                                </label>
                                <input
                                    name="zipCode"
                                    value={form.zipCode}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Država <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        isActive: e.target.checked,
                                    })
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm text-zinc-700">
                                Klub je aktivan i vidljiv u pretrazi
                            </span>
                        </label>

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
                            disabled={saving}
                            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Čuvanje..." : "Sačuvaj izmene"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}