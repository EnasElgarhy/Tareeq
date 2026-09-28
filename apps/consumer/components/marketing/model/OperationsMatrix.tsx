import { ARCHETYPES } from "./modelContent";

const AXIS =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--day-ink-3)]";

/** Processing style × scope of focus: your archetype is where they cross. */
export function OperationsMatrix() {
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <div className="mb-4 grid grid-cols-2 gap-3 ps-0 sm:ps-8">
        <p className={`${AXIS} text-center`}>Structured</p>
        <p className={`${AXIS} text-center`}>Flexible</p>
      </div>
      <div className="flex gap-3">
        <div className="hidden flex-col justify-around sm:flex">
          <p className={`${AXIS} [writing-mode:vertical-rl] rotate-180`}>
            Deep
          </p>
          <p className={`${AXIS} [writing-mode:vertical-rl] rotate-180`}>
            Broad
          </p>
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-3">
          {ARCHETYPES.map(({ name, formula, body, icon: Icon, accent }) => (
            <li
              key={name}
              className="flex flex-col items-start rounded-2xl bg-[var(--day-bg)] p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <span
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{ background: `${accent}1F`, color: accent }}
              >
                <Icon size={26} weight="duotone" aria-hidden="true" />
              </span>
              <p
                className="font-heading mt-4 text-lg font-semibold sm:text-xl"
                style={{ color: accent }}
              >
                {name}
              </p>
              <p className="sr-only">{formula}.</p>
              <p className="mt-1 text-sm leading-snug text-[var(--day-ink-2)]">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
