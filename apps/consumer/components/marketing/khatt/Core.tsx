import type { CSSProperties } from "react";
import { Thread } from "./Thread";

/** Dimension accents carry over from the existing CORE surfaces. */
const DIMENSIONS = [
  {
    letter: "C",
    name: "Curiosities",
    question: "What captures your attention?",
    tone: "#B07A18",
  },
  {
    letter: "O",
    name: "Operations",
    question: "How do you naturally function?",
    tone: "#6D5BA8",
  },
  {
    letter: "R",
    name: "Rewards",
    question: "Why do you strive for success?",
    tone: "#C96F63",
  },
  {
    letter: "E",
    name: "Ecosystems",
    question: "Where do you thrive?",
    tone: "#3D8A73",
  },
];

/** Mirrors lib/results/cluster-visuals.ts so a cluster reads the same colour
 *  here as it does in the user's result. */
const CLUSTERS = [
  { label: "Technology", tone: "var(--cluster-tech)" },
  { label: "Engineering", tone: "var(--cluster-eng)" },
  { label: "Science/Data", tone: "var(--cluster-sci)" },
  { label: "Arts/Media", tone: "var(--cluster-art)" },
  { label: "Business", tone: "var(--cluster-bus)" },
  { label: "Law/Diplomacy", tone: "var(--cluster-law)" },
  { label: "People/Psychology", tone: "var(--cluster-ppl)" },
  { label: "Environment", tone: "var(--cluster-env)" },
];

export const Core = () => (
  <>
    <section id="how" className="field field--sand" aria-labelledby="core-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="core-heading" className="heading">
          Four dimensions. One honest map of you.
        </h2>

        <div className="dimensions">
          {DIMENSIONS.map((dimension) => (
            <article
              key={dimension.name}
              className="dimension"
              style={{ "--tone": dimension.tone } as CSSProperties}
            >
              <span className="dimension__letter" aria-hidden="true">
                {dimension.letter}
              </span>
              <div>
                <h3 className="dimension__name">{dimension.name}</h3>
                <p className="dimension__q">{dimension.question}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="meta">
          You answer. Kai turns it into a map with no jargon and no scores
          without meaning.
        </p>
      </div>
    </section>

    <section className="field field--sand" aria-labelledby="clusters-heading">
      <div className="field__inner stack">
        <Thread />
        <h2 id="clusters-heading" className="heading">
          Eight clusters your result can point to.
        </h2>
        <ul className="clusters">
          {CLUSTERS.map((cluster) => (
            <li
              key={cluster.label}
              className="cluster"
              style={{ "--tone": cluster.tone } as CSSProperties}
            >
              {cluster.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  </>
);
