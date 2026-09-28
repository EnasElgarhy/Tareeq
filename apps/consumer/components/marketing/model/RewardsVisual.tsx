import { DRIVERS } from "./modelContent";

const ACCENT = "#B45C50";

export function RewardsVisual() {
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">
        Five motivational drivers
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {DRIVERS.map(({ name, body, icon: Icon }, i) => (
          <li
            key={name}
            className={`flex flex-col items-start rounded-2xl bg-[var(--day-bg)] p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5 ${
              // 3 + 2 on a 6-column grid, so the second row fills edge to edge.
              i < 3 ? "sm:col-span-2" : "sm:col-span-3"
            } ${i === DRIVERS.length - 1 ? "col-span-2" : ""}`}
          >
            <span
              className="flex size-12 items-center justify-center rounded-2xl bg-[#F2A8B3]/30"
              style={{ color: ACCENT }}
            >
              <Icon size={26} weight="duotone" aria-hidden="true" />
            </span>
            <p className="font-heading mt-4 text-lg font-semibold text-[var(--day-ink)]">
              {name}
            </p>
            <p className="mt-1 text-sm leading-snug text-[var(--day-ink-2)]">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
