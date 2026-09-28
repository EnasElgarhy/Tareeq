import { Thread } from "./Thread";

const STATS = [
  { value: "54", label: "questions" },
  { value: "~12", label: "minutes" },
  { value: "8", label: "career clusters" },
  { value: "4", label: "dimensions of fit" },
];

export const Stats = () => (
  <section className="field" aria-label="What the assessment involves">
    <div className="field__inner">
      <Thread />
      <div className="readout">
        {STATS.map((stat) => (
          <p key={stat.label}>
            <span className="readout__value">{stat.value}</span>
            <span className="readout__label">{stat.label}</span>
          </p>
        ))}
      </div>
    </div>
  </section>
);
