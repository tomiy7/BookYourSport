"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type UserState = {
    isLoggedIn: boolean;
    name: string;
};

function getUserNameFromToken(token: string): string {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return "";
        }

        const decodedPayload = JSON.parse(
            decodeURIComponent(
                atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
                    .split("")
                    .map((character) => {
                        return (
                            "%" +
                            ("00" + character.charCodeAt(0).toString(16)).slice(
                                -2
                            )
                        );
                    })
                    .join("")
            )
        );

        return (
            decodedPayload.firstName ||
            decodedPayload.name ||
            decodedPayload.given_name ||
            decodedPayload.unique_name ||
            decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
                ] ||
            decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                ] ||
            ""
        );
    } catch {
        return "";
    }
}

export default function Header() {
    const [user, setUser] = useState<UserState>({
        isLoggedIn: false,
        name: "",
    });

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        function checkAuth() {
            const accessToken = localStorage.getItem("accessToken");
            const savedUserName = localStorage.getItem("userName");

            if (!accessToken) {
                setUser({
                    isLoggedIn: false,
                    name: "",
                });

                return;
            }

            const nameFromToken =
                getUserNameFromToken(accessToken);

            setUser({
                isLoggedIn: true,
                name:
                    savedUserName ||
                    nameFromToken ||
                    "Moj nalog",
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

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userName");

        setUser({
            isLoggedIn: false,
            name: "",
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
                            <Link
                                href="/player-dashboard"
                                className="dropdown-item"
                                onClick={() =>
                                    setMenuOpen(false)
                                }
                            >
                                Moj nalog
                            </Link>

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