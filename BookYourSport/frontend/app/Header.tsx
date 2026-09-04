"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, getDashboardPath } from "@/lib/user";

type UserState = {
    isLoggedIn: boolean;
    name: string;
    role: string;
};

export default function Header() {
    const router = useRouter();

    const [user, setUser] = useState<UserState>({
        isLoggedIn: false,
        name: "",
        role: "",
    });

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        function checkAuth() {
            const accessToken = localStorage.getItem("accessToken");
            const storedUser = getStoredUser();

            if (!accessToken || !storedUser) {
                setUser({
                    isLoggedIn: false,
                    name: "",
                    role: "",
                });

                return;
            }

            setUser({
                isLoggedIn: true,
                name: storedUser.firstName || "Moj nalog",
                role: storedUser.role,
            });
        }

        checkAuth();

        window.addEventListener(
            "auth-change",
            checkAuth
        );

        window.addEventListener(
            "storage",
            checkAuth
        );

        return () => {
            window.removeEventListener(
                "auth-change",
                checkAuth
            );

            window.removeEventListener(
                "storage",
                checkAuth
            );
        };
    }, []);

    function handleMyAccount() {
        const storedUser = getStoredUser();

        if (!storedUser) {
            router.push("/login");
            return;
        }

        router.push(getDashboardPath(storedUser.role));

        setMenuOpen(false);
    }

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("firstName");

        setUser({
            isLoggedIn: false,
            name: "",
            role: "",
        });

        setMenuOpen(false);

        window.dispatchEvent(
            new Event("auth-change")
        );
    }

    return (
        <header className="site-header">
            <Link
                href="/"
                className="site-logo"
            >
                <Image
                    src="/logo.png"
                    alt="BookYourSport"
                    width={130}
                    height={50}
                    priority
                />
            </Link>

            {!user.isLoggedIn ? (
                <nav className="site-nav">
                    <Link
                        href="/login"
                        className="login-button"
                    >
                        Prijavi se
                    </Link>

                    <Link
                        href="/register"
                        className="register-button"
                    >
                        Registruj se
                    </Link>
                </nav>
            ) : (
                <div className="user-menu">
                    <button
                        type="button"
                        className="user-button"
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                    >
                        <span className="user-icon">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 21a8 8 0 0 0-16 0" />

                                <circle
                                    cx="12"
                                    cy="7"
                                    r="4"
                                />
                            </svg>
                        </span>

                        <span className="user-name">
                            {user.name}
                        </span>

                        <span className="menu-arrow">
                            ▾
                        </span>
                    </button>

                    {menuOpen && (
                        <div className="dropdown-menu">
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={handleMyAccount}
                            >
                                Moj nalog
                            </button>

                            <button
                                type="button"
                                className="dropdown-item logout-item"
                                onClick={handleLogout}
                            >
                                Odjavi se
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
