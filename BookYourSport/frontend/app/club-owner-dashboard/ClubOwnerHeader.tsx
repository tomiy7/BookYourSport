"use client";

import Image from "next/image";
import Link from "next/link";
import {
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type StoredUser } from "@/lib/user";

export default function ClubOwnerHeader() {
    const router = useRouter();

    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [user, setUser] =
        useState<StoredUser | null>(null);

    const menuRef =
        useRef<HTMLDivElement>(null);

    function loadUserFromStorage() {
        setUser(getStoredUser());
    }

    useEffect(() => {
        loadUserFromStorage();

        window.addEventListener(
            "auth-change",
            loadUserFromStorage
        );

        return () => {
            window.removeEventListener(
                "auth-change",
                loadUserFromStorage
            );
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(
            event: MouseEvent
        ) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("firstName");

        window.dispatchEvent(
            new Event("auth-change")
        );

        setIsMenuOpen(false);

        router.push("/");
    }

    const firstName =
        user?.firstName || "Moj klub";

    const firstLetter =
        firstName.charAt(0).toUpperCase();

    return (
        <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">

                <Link
                    href="/club-owner-dashboard"
                    className="flex items-center"
                >
                    <Image
                        src="/logo.png"
                        alt="BookYourSport"
                        width={120}
                        height={60}
                        priority
                        className="h-auto w-[110px]"
                    />
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <Link
                        href="/club-owner-dashboard"
                        className="text-sm font-semibold text-zinc-600 transition hover:text-green-800"
                    >
                        Pregled
                    </Link>

                    <Link
                        href="/club-owner-dashboard/reservations"
                        className="text-sm font-semibold text-zinc-600 transition hover:text-green-800"
                    >
                        Rezervacije
                    </Link>

                    <Link
                        href="/club-owner-dashboard/courts"
                        className="text-sm font-semibold text-zinc-600 transition hover:text-green-800"
                    >
                        Tereni
                    </Link>

                    <Link
                        href="/club-owner-dashboard/edit-club"
                        className="text-sm font-semibold text-zinc-600 transition hover:text-green-800"
                    >
                        Podaci o klubu
                    </Link>
                </nav>

                <div
                    className="relative"
                    ref={menuRef}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setIsMenuOpen(
                                !isMenuOpen
                            )
                        }
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-zinc-100"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                            {firstLetter}
                        </div>

                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-zinc-800">
                                {firstName}
                            </p>

                            <p className="text-xs text-zinc-500">
                                Club Owner
                            </p>
                        </div>

                        <span className="text-xs text-zinc-500">
                            ▼
                        </span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                                Odjavi se
                            </button>

                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
