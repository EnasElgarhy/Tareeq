import { Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { Container, FadeIn } from "../Shared";
import { COMPARISON, PILLARS } from "./modelContent";

function Mark({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#2F7A64] text-[#FFFCF6]">
      <Check size={16} weight="bold" aria-hidden="true" />
      <span className="sr-only">{label}: yes</span>
    </span>
  ) : (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--day-inset)] text-[var(--day-ink-3)]">
      <Minus size={16} weight="bold" aria-hidden="true" />
      <span className="sr-only">{label}: no</span>
    </span>
  );
}

export function CoreComparison() {
  return (
    <section
      aria-labelledby="core-comparison-heading"
      className="border-t border-[var(--day-line)] py-20 lg:py-28"
    >
      <Container>
        <div className="mx-auto max-w-4xl">
          <FadeIn className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7A4A21]">
              {COMPARISON.eyebrow}
            </p>
            <h2
              id="core-comparison-heading"
              className="font-heading mt-4 text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
            >
              {COMPARISON.title}{" "}
              <span className="text-[#6D5BA8]">{COMPARISON.accent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[var(--day-ink-2)]">
              {COMPARISON.body}
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-12">
            <div className="overflow-hidden rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] shadow-[var(--day-shadow-hero)]">
              <table className="w-full border-collapse">
                <caption className="sr-only">
                  What Holland’s RIASEC and CORE each measure
                </caption>
                <thead>
                  <tr className="border-b border-[var(--day-line)]">
                    <th
                      scope="col"
                      className="p-5 text-start text-sm font-medium text-[var(--day-ink-3)] sm:px-8"
                    >
                      What it covers
                    </th>
                    <th scope="col" className="w-24 p-5 text-center sm:w-32">
                      <span className="block text-sm font-semibold text-[var(--day-ink)]">
                        RIASEC
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="w-24 bg-[#1B1240] p-5 text-center sm:w-32"
                    >
                      <span className="font-heading flex justify-center gap-0.5 text-base font-bold">
                        {PILLARS.map((p) => (
                          <span key={p.id} style={{ color: p.nightAccent }}>
                            {p.letter}
                          </span>
                        ))}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.rows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-[var(--day-line)] last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="p-5 text-start text-[0.9375rem] font-medium text-[var(--day-ink)] sm:px-8"
                      >
                        {row.label}
                      </th>
                      <td className="p-5 text-center">
                        <Mark on={row.riasec} label="RIASEC" />
                      </td>
                      <td className="bg-[#1B1240]/[0.04] p-5 text-center">
                        <Mark on label="CORE" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
