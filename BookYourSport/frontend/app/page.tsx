"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import styles from "./page.module.css";
import Footer from "./Footer";
import Header from "./Header";

export default function Home() {
    const router = useRouter();

    const [query, setQuery] = useState("");

    function handleSearchSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            router.push("/clubs");
            return;
        }

        router.push(
            `/clubs?query=${encodeURIComponent(
                trimmedQuery
            )}`
        );
    }

    return (
        <main className={styles.page}>
            <Header />

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <span className={styles.badge}>
                        Rezerviši svoj termin
                    </span>

                    <h1>
                        Pronađi i rezerviši
                        <span> savršen teniski teren</span>
                    </h1>

                    <p>
                        Istraži teniske klubove, pronađi slobodne terene i
                        rezerviši svoj sledeći termin brzo i jednostavno.
                    </p>

                    <form
                        onSubmit={handleSearchSubmit}
                        className={styles.searchForm}
                    >
                        <input
                            type="text"
                            value={query}
                            onChange={(e) =>
                                setQuery(e.target.value)
                            }
                            placeholder="Pretraži klub ili lokaciju..."
                            className={styles.searchInput}
                        />

                        <button
                            type="submit"
                            className={styles.searchButton}
                        >
                            Pretraži
                        </button>
                    </form>

                    <Link
                        href="/clubs"
                        className={styles.browseAllLink}
                    >
                        Pregledaj sve klubove

                        <span>
                            →
                        </span>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}