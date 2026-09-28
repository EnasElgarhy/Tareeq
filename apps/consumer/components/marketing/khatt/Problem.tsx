import { Compass, HandHeart, ChatCircleText } from "@phosphor-icons/react/ssr";
import { Thread } from "./Thread";

const PAINS = [
  "Built for Western job markets",
  "Assume years of work experience",
  "Measure interests, and nothing else",
];

const DIFFERENT = [
  {
    icon: ChatCircleText,
    title: "Real situations, not abstractions",
    body: "Questions about things you’re already doing, with no work experience needed.",
  },
  {
    icon: Compass,
    title: "Built for MENA",
    body: "Your job markets, your universities, your family context. Not adapted from the West.",
  },
  {
    icon: HandHeart,
    title: "Free for everyone",
    body: "Career guidance used to be a privilege. One assessment, open to all.",
  },
];

export const Problem = () => (
  <>
    <section
      className="field field--paper"
      aria-labelledby="problem-heading"
    >
      <div className="field__inner stack">
        <Thread />
        <h2 id="problem-heading" className="heading">
          Career tools were built for someone else.
        </h2>
        <ul className="list">
          {PAINS.map((pain) => (
            <li key={pain}>{pain}</li>
          ))}
        </ul>
        <p className="lead">Tareeq starts from your reality.</p>
      </div>
    </section>

    <section className="field field--paper" aria-label="What makes Tareeq different">
      <div className="field__inner">
        <Thread />
        <div className="entries entries--lead">
          {DIFFERENT.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="entry">
                <span className="entry__icon" aria-hidden="true">
                  <Icon size={24} weight="light" />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  </>
);
