import { CAREER_CLUSTERS } from "../WayIcons";

const ACCENT = "#9A6A12";

export function CuriositiesVisual() {
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">
        Eight career clusters
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CAREER_CLUSTERS.map(({ label, icon: Icon }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--day-bg)] px-3 py-5 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <span
              className="flex size-12 items-center justify-center rounded-2xl bg-[#F4C660]/25"
              style={{ color: ACCENT }}
            >
              <Icon size={24} />
            </span>
            <span className="text-sm font-medium leading-tight text-[var(--day-ink)]">
              {label.replace("/", " / ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
