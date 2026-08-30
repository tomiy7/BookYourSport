import Link from "next/link";
import styles from "./page.module.css";
import Footer from "./Footer";
import Header from "./Header";

export default function Home() {
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

                    <Link
                        href="/clubs"
                        className={styles.findCourtButton}
                    >
                        Pronađi teniski teren

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