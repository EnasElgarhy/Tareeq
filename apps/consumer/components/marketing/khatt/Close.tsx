import Image from "next/image";
import Link from "next/link";
import { Thread } from "./Thread";

const FAQS = [
  {
    q: "Is my data private?",
    a: "Yes — your responses are encrypted, and you decide who sees your results.",
  },
  {
    q: "Is this scientifically valid?",
    a: "Yes — CORE is built on four validated frameworks from career and organizational psychology: RIASEC, the Big Five, Self-Determination Theory, and Person-Environment Fit.",
  },
  {
    q: "How much does it cost?",
    a: "Free during our current testing phase. Pricing will apply once we launch publicly.",
  },
];

export const Close = () => (
  <>
    <section className="field" aria-labelledby="kai-heading">
      <div className="field__inner">
        <Thread />
        <div className="split">
          <div className="stack">
            <h2 id="kai-heading" className="heading">
              Walking with Kai
            </h2>
            <p className="lead">
              Kai reads your result with you, answers what you actually want to
              ask, and keeps track of where you got to.
            </p>
          </div>
          <Image
            src="/marketing/daybreak/kai/kai-720.png"
            alt="Kai, the Tareeq career guide"
            width={720}
            height={720}
            className="split__figure"
            sizes="(min-width: 60rem) 26rem, 60vw"
          />
        </div>
      </div>
    </section>

    <section className="field field--dusk" aria-label="Student story">
      <div className="field__inner">
        <Thread />
        <figure className="quote">
          <blockquote>
            I knew I needed fast-paced environments. I just didn’t have language
            for it. Now I’m choosing with confidence.
          </blockquote>
          <figcaption>Salma, student, 16, UAE</figcaption>
        </figure>
      </div>
    </section>

    <section id="start" className="field" aria-labelledby="close-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="close-heading" className="heading">
          Understand yourself. Choose with confidence.
        </h2>
        <div className="actions">
          <Link
            href="/start"
            className="btn btn--gold"
            data-testid="final-cta-start"
          >
            Start assessment
          </Link>
          <Link href="/model" className="btn btn--quiet">
            How it works
          </Link>
        </div>
        <p className="meta">Free to start. No account needed to begin.</p>
      </div>
    </section>

    <section className="field" aria-labelledby="faq-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="faq-heading" className="heading">
          Good questions.
        </h2>
        <div className="entries">
          {FAQS.map((faq) => (
            <article key={faq.q} className="entry">
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </article>
          ))}
        </div>
        <Link href="/faq" className="btn btn--quiet">
          See all FAQs
        </Link>
      </div>
    </section>
  </>
);
