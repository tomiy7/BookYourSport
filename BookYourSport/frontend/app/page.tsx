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

            <div className={styles.searchBox}>
              <input
                  type="text"
                  placeholder="Pretraži po klubu ili lokaciji..."
              />

              <button type="button">
                Pretraži
              </button>
            </div>
          </div>
        </section>

        <section className={styles.courtsSection}>
          <div className={styles.sectionHeading}>
            <span>PRONAĐI TEREN</span>

            <h2>Tenis počinje ovde</h2>

            <p>
              Izaberi klub i pronađi idealan teren za svoj sledeći
              meč.
            </p>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <span className={styles.iconCircleOne} />
              </div>

              <h3>Pronađi klub</h3>

              <p>
                Pretraži teniske klubove i pronađi lokaciju koja ti
                najviše odgovara.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <span className={styles.iconCircleTwo} />
              </div>

              <h3>Izaberi termin</h3>

              <p>
                Pogledaj dostupne terene i odaberi datum i vreme
                koje ti odgovara.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <span className={styles.iconCircleThree} />
              </div>

              <h3>Rezerviši</h3>

              <p>
                Potvrdi rezervaciju i spreman si za svoj sledeći
                teniski meč.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
  );
}