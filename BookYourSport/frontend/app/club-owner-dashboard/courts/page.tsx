"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClubOwnerHeader from "../ClubOwnerHeader";
import { getStoredUser } from "@/lib/user";
import { getAccessToken } from "@/lib/auth";
import {
    getClubs,
    createCourt,
    updateCourt,
    deleteCourt,
    type Club,
    type Court,
    type CourtPayload,
} from "@/lib/reservationApi";

const SURFACE_TYPES = [
    { value: 0, label: "Beton" },
    { value: 1, label: "Šljaka" },
    { value: 2, label: "Trava" },
    { value: 3, label: "Tepih" },
];

function surfaceLabel(value: number | string) {
    const numeric = typeof value === "string" ? Number(value) : value;
    return (
        SURFACE_TYPES.find((s) => s.value === numeric)?.label ??
        String(value)
    );
}

const emptyForm: CourtPayload = {
    name: "",
    surfaceType: 0,
    isIndoor: false,
    pricePerHour: 0,
    currency: "RSD",
};

export default function CourtsPage() {
    const router = useRouter();

    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CourtPayload>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    function loadClub() {
        const user = getStoredUser();

        getClubs()
            .then((clubs) => {
                const ownClub = clubs.find(
                    (c) => c.ownerId === user?.id
                );

                setClub(ownClub ?? null);
            })
            .catch(() =>
                setError("Nije moguće učitati podatke o klubu.")
            )
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        const token = getAccessToken();
        const user = getStoredUser();

        if (!token || !user) {
            router.push("/login");
            return;
        }

        loadClub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    function openCreateForm() {
        setEditingCourt(null);
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
    }

    function openEditForm(court: Court) {
        setEditingCourt(court);
        setForm({
            name: court.name,
            surfaceType: Number(court.surfaceType),
            isIndoor: court.isIndoor,
            pricePerHour: court.pricePerHour.amount,
            currency: court.pricePerHour.currency,
        });
        setFormError("");
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!club) return;

        setFormError("");
        setSaving(true);

        const token = getAccessToken();

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            if (editingCourt) {
                await updateCourt(
                    club.id,
                    editingCourt.id,
                    { ...form, isActive: editingCourt.isActive }
                );
            } else {
                await createCourt(club.id, form);
            }

            setShowForm(false);
            setLoading(true);
            loadClub();
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : "Čuvanje terena nije uspelo."
            );
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(court: Court) {
        if (!club) return;

        const token = getAccessToken();
        if (!token) return;

        try {
            await updateCourt(
                club.id,
                court.id,
                {
                    name: court.name,
                    surfaceType: Number(court.surfaceType),
                    isIndoor: court.isIndoor,
                    pricePerHour: court.pricePerHour.amount,
                    currency: court.pricePerHour.currency,
                    isActive: !court.isActive,
                }
            );

            loadClub();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Izmena statusa terena nije uspela."
            );
        }
    }

    async function handleDeleteCourt(court: Court) {
        if (!club) return;

        const confirmed = window.confirm(
            `Obriši teren "${court.name}"? Ova akcija je nepovratna.`
        );

        if (!confirmed) return;

        const token = getAccessToken();
        if (!token) return;

        try {
            await deleteCourt(club.id, court.id);
            loadClub();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Brisanje terena nije uspelo."
            );
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
                <p className="text-zinc-500">Učitavanje...</p>
            </main>
        );
    }

    if (!club) {
        return (
            <main className="min-h-screen bg-[#f7f8f7]">
                <ClubOwnerHeader />
                <section className="mx-auto w-full max-w-2xl px-6 py-12 text-center">
                    <p className="text-zinc-600">
                        Prvo napravi klub da bi mogao da dodaješ terene.
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f7]">
            <ClubOwnerHeader />

            <section className="mx-auto w-full max-w-4xl px-6 py-10">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                            {club.name.toUpperCase()}
                        </span>

                        <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                            Tereni
                        </h1>
                    </div>

                    <button
                        onClick={openCreateForm}
                        className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                        Dodaj teren
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {club.courts.length === 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
                        Još uvek nemaš dodatih terena.
                    </div>
                )}

                <div className="space-y-4">
                    {club.courts.map((court) => (
                        <div
                            key={court.id}
                            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-5"
                        >
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-semibold text-zinc-800">
                                        {court.name}
                                    </h2>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            court.isActive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-zinc-100 text-zinc-500"
                                        }`}
                                    >
                                        {court.isActive ? "Aktivan" : "Neaktivan"}
                                    </span>
                                </div>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {surfaceLabel(court.surfaceType)} ·{" "}
                                    {court.isIndoor ? "Zatvoreni" : "Otvoreni"} ·{" "}
                                    {court.pricePerHour.amount}{" "}
                                    {court.pricePerHour.currency} / sat
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => toggleActive(court)}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                                >
                                    {court.isActive ? "Deaktiviraj" : "Aktiviraj"}
                                </button>

                                <button
                                    onClick={() => openEditForm(court)}
                                    className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                                >
                                    Izmeni
                                </button>

                                <button
                                    onClick={() => handleDeleteCourt(court)}
                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    Obriši
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-zinc-800">
                                {editingCourt ? "Izmeni teren" : "Novi teren"}
                            </h2>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-5"
                            >
                                {formError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {formError}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                        Naziv terena <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                        required
                                        maxLength={50}
                                        className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                        Podloga
                                    </label>
                                    <select
                                        value={form.surfaceType}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                surfaceType: Number(e.target.value),
                                            })
                                        }
                                        className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                    >
                                        {SURFACE_TYPES.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={form.isIndoor}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                isIndoor: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm text-zinc-700">
                                        Zatvoreni teren
                                    </span>
                                </label>

                                <div className="grid grid-cols-[2fr_1fr] gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                            Cena po satu <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={form.pricePerHour}
                                            onChange={(e) => {
                                                const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                                                setForm({
                                                    ...form,
                                                    pricePerHour: Number(cleaned) || 0,
                                                });
                                            }}
                                            required
                                            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                            Valuta
                                        </label>
                                        <input
                                            value={form.currency}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    currency: e.target.value,
                                                })
                                            }
                                            maxLength={3}
                                            className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 rounded-lg border border-zinc-300 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                                    >
                                        Otkaži
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 rounded-lg bg-green-700 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving ? "Čuvanje..." : "Sačuvaj"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
