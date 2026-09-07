"use client";

import Image from "next/image";
import Link from "next/link";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    getDashboardPath,
    getStoredUser,
} from "@/lib/user";


interface User {
    firstName: string;
    lastName: string;
    email: string;
    city?: string | null;
    dateOfBirth?: string | null;
    role: string;
}


export default function PlayerHeader() {
    const router =
        useRouter();


    // ==========================================
    // STATE
    // ==========================================

    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [user, setUser] =
        useState<User | null>(null);


    const menuRef =
        useRef<HTMLDivElement>(null);


    // ==========================================
    // UCITAVANJE USER-A
    // ==========================================

    function loadUserFromStorage() {
        const savedUser =
            getStoredUser();

        setUser(
            savedUser as User | null
        );
    }


    // ==========================================
    // AUTH CHANGE
    // ==========================================

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


    // ==========================================
    // ZATVARANJE MENIJA KLIKOM VAN
    // ==========================================

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


    // ==========================================
    // LOGOUT
    // ==========================================

    function handleLogout() {

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "refreshToken"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "firstName"
        );


        window.dispatchEvent(
            new Event("auth-change")
        );


        setUser(null);
        setIsMenuOpen(false);

        router.replace("/");
    }


    // ==========================================
    // MOJ NALOG
    // ==========================================

    function handleMyAccount() {

        if (!user) {
            setIsMenuOpen(false);

            router.push("/login");

            return;
        }


        router.push(
            getDashboardPath(
                user.role
            )
        );


        setIsMenuOpen(false);
    }


    // ==========================================
    // USER DISPLAY
    // ==========================================

    const firstName =
        user?.firstName ||
        "Moj nalog";


    const firstLetter =
        firstName
            .charAt(0)
            .toUpperCase();


    // Backend vraca:
    // player
    // admin
    // club

    const normalizedRole =
        user?.role
            ?.trim()
            .toLowerCase();


    const roleLabel =
        normalizedRole === "admin"
            ? "Admin"
            : normalizedRole === "club"
                ? "Club Owner"
                : "Player";


    return (
        <header className="border-b border-zinc-200 bg-white">

            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">

                {/* ================================= */}
                {/* LOGO */}
                {/* ================================= */}

                <Link
                    href="/"
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


                {/* ================================= */}
                {/* USER MENU */}
                {/* ================================= */}

                <div
                    className="relative"
                    ref={menuRef}
                >

                    <button
                        type="button"

                        onClick={() =>
                            setIsMenuOpen(
                                (previousValue) =>
                                    !previousValue
                            )
                        }

                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-zinc-100"
                    >

                        {/* AVATAR */}

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">

                            {firstLetter}

                        </div>


                        {/* USER INFO */}

                        <div className="hidden sm:block">

                            <p className="text-sm font-semibold text-zinc-800">
                                {firstName}
                            </p>

                            <p className="text-xs text-zinc-500">
                                {roleLabel}
                            </p>

                        </div>


                        <span className="text-xs text-zinc-500">
                            ▼
                        </span>

                    </button>


                    {/* ================================= */}
                    {/* DROPDOWN */}
                    {/* ================================= */}

                    {isMenuOpen && (

                        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">


                            {/* MOJ NALOG */}

                            <button
                                type="button"
                                onClick={
                                    handleMyAccount
                                }
                                className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                            >
                                Moj nalog
                            </button>


                            {/* LOGOUT */}

                            <button
                                type="button"
                                onClick={
                                    handleLogout
                                }
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