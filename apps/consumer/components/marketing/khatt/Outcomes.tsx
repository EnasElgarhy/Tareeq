import Image from "next/image";
import { Thread } from "./Thread";

/** Real captures of the product, not mockups. Regenerate by seeding
 *  e2e/fixtures/report.ts into localStorage and screenshotting the routes. */
const OUTCOMES = [
  {
    title: "Your compass",
    body: "The cluster you lean toward, how you work, what drives you, and where you fit.",
    src: "/marketing/khatt/compass.png",
    alt: "The Career Compass screen showing a Business curiosity signal",
  },
  {
    title: "Careers worth a look",
    body: "Real roles matched to your result, with what each one actually involves.",
    src: "/marketing/khatt/explore.png",
    alt: "The explore screen listing career matches",
  },
  {
    title: "A profile that keeps up",
    body: "Your result, saved. Come back to it as your thinking changes.",
    src: "/marketing/khatt/profile.png",
    alt: "The profile screen showing a saved CORE compass",
  },
];

export const Outcomes = () => (
  <>
    <section className="field field--paper" aria-labelledby="outcomes-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="outcomes-heading" className="heading">
          More than a score. Yours to use.
        </h2>
        <p className="lead">
          A clear compass, a practical report, and a summary you can share with
          the people helping you choose.
        </p>

        <div className="shots">
          {OUTCOMES.map((item) => (
            <figure key={item.title} className="shot">
              <Image
                src={item.src}
                alt={item.alt}
                width={390}
                height={800}
                className="shot__img"
                sizes="(min-width: 60rem) 22rem, 80vw"
              />
              <figcaption className="shot__caption">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>

    <section className="field field--sand" aria-labelledby="science-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="science-heading" className="heading">
          The science behind CORE
        </h2>
        <p className="lead">
          Built on decades of validated career theories, not guesswork.
        </p>
        <div className="prose">
          <p>
            CORE draws on four established frameworks in career and personality
            psychology: Holland’s RIASEC model for Curiosities (what captures
            your attention), Big Five personality research for Operations (how
            you naturally work), Self-Determination Theory for Rewards (what
            drives you), and Person-Environment Fit theory for Ecosystems (where
            you thrive). Scoring is transparent and rule-based, with no black box
            and no machine learning guessing at you. And because these frameworks
            were largely built and validated in the US and Europe, CORE adds
            context specific to how the MENA job market and education system
            actually work.
          </p>
          <p>
            Designed by Enas Elgarhy, a BPS-certified assessor and
            ICF-accredited coach, with 22+ years in people development and
            psychometric assessment, including tools like Hogan, Saville, Korn
            Ferry, and MBTI, across the MENA region.
          </p>
        </div>
      </div>
    </section>
  </>
);
