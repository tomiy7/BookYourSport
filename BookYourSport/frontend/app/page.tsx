import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <Image
                src="/logo.png"
                alt="BookYourSport"
                width={130}
                height={50}
                className={styles.logoImage}
                priority
            />
          </Link>

          <nav className={styles.nav}>
            <Link href="/login" className={styles.loginButton}>
              Prijavi se
            </Link>

            <Link href="/register" className={styles.registerButton}>
              Registruj se
            </Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>🎾 Rezerviši svoj termin</span>

            <h1>
              Pronađi i rezerviši
              <span> savršen teniski teren</span>
            </h1>

            <p>
              Istraži teniske klubove, pronađi slobodne terene i rezerviši svoj
              sledeći termin brzo i jednostavno.
            </p>

            <div className={styles.searchBox}>
              <input
                  type="text"
                  placeholder="Pretraži po klubu ili lokaciji..."
              />

              <button>Pretraži</button>
            </div>
          </div>
        </section>

        <section className={styles.courtsSection}>
          <div className={styles.sectionHeading}>
            <span>PRONAĐI TEREN</span>

            <h2>Tenis počinje ovde</h2>

            <p>
              Izaberi klub i pronađi idealan teren za svoj sledeći meč.
            </p>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🎾</div>

              <h3>Pronađi klub</h3>

              <p>
                Pretraži teniske klubove i pronađi lokaciju koja ti najviše
                odgovara.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>📅</div>

              <h3>Izaberi termin</h3>

              <p>
                Pogledaj dostupne terene i odaberi datum i vreme koje ti
                odgovara.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>✓</div>

              <h3>Rezerviši</h3>

              <p>
                Potvrdi rezervaciju i spreman si za svoj sledeći teniski meč.
              </p>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>© 2026 BookYourSport. Sva prava zadržana.</p>

          <div className={styles.footerLinks}>
            <a href="#">O nama</a>
            <a href="#">Kontakt</a>
            <a href="#">Uslovi korišćenja</a>
          </div>
        </footer>
      </main>
  );
}