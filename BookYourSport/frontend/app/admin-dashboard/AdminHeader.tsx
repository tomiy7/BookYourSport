"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();

    function navClass(path: string) {
        const isActive =
            pathname === path ||
            pathname.startsWith(`${path}/`);

        return `text-sm font-medium transition ${
            isActive
                ? "font-bold text-green-700"
                : "text-green-700 hover:text-green-800"
        }`;
    }

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("firstName");

        window.dispatchEvent(new Event("auth-change"));

        router.push("/login");
    }

    return (
        <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">

                {/* LOGO */}
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

                {/* ADMIN NAVIGACIJA */}
                <nav className="flex items-center gap-6">

                    <Link
                        href="/admin-dashboard"
                        className={navClass(
                            "/admin-dashboard"
                        )}
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/admin-dashboard/owner-requests"
                        className={navClass(
                            "/admin-dashboard/owner-requests"
                        )}
                    >
                        Club Owner zahtevi
                    </Link>

                    <Link
                        href="/admin-dashboard/users"
                        className={navClass(
                            "/admin-dashboard/users"
                        )}
                    >
                        Korisnici
                    </Link>

                    {/* LOGOUT */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-sm font-medium text-red-600 transition hover:text-red-700"
                    >
                        Odjavi se
                    </button>

                </nav>
            </div>
        </header>
    );
}