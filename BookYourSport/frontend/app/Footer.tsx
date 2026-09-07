import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-zinc-200 bg-white">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-zinc-500 md:flex-row">
                <p>© 2026 BookYourSport. Sva prava zadržana.</p>

                <div className="flex items-center gap-5">
                    <Link
                        href="#"
                        className="transition hover:text-green-700"
                    >
                        O nama
                    </Link>

                    <Link
                        href="#"
                        className="transition hover:text-green-700"
                    >
                        Kontakt
                    </Link>

                    <Link
                        href="#"
                        className="transition hover:text-green-700"
                    >
                        Uslovi korišćenja
                    </Link>
                </div>
            </div>
        </footer>
    );
}