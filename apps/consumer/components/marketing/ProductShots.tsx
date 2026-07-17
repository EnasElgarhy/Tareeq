import { motion } from "framer-motion";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import { KAI_SRC_SM } from "./KaiGuide";
import { WayCatalyst, WayLeaf, WayHeart, type WayIconProps } from "./WayIcons";

interface FrameProps {
  children: ReactNode;
  tilt?: number;
  className?: string;
}

interface BarProps {
  label: string;
  value: number;
  color: string;
  delay?: number;
}

interface ProductShot {
  shot: ComponentType;
  tilt: number;
  lift: string;
  title: string;
  body: string;
}

const COMPASS_DETAILS: ReadonlyArray<
  [string, string, ComponentType<WayIconProps>]
> = [
  ["Drives you", "Impact", WayHeart],
  ["Thrives in", "Dynamic teams", WayLeaf],
];

/**
 * Product mockups for the "What you get" section — the three deliverables
 * rendered as living app shots (code, not images: crisp on every screen,
 * animated on scroll, always on-brand).
 */

const Frame = ({ children, tilt = 0, className = "" }: FrameProps) => (
  <motion.div
    whileHover={{ y: -6, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200, damping: 18 }}
    style={{ rotate: tilt }}
    className={`rounded-story border border-[var(--day-line)] bg-[var(--day-elevated)] shadow-[0_24px_60px_rgba(42,33,24,0.14)] p-2.5 ${className}`}
  >
    <div className="rounded-[1.6rem] overflow-hidden">{children}</div>
  </motion.div>
);

const Bar = ({ label, value, color, delay = 0 }: BarProps) => (
  <div className="mb-3.5">
    <div className="flex justify-between text-xs text-[var(--day-ink-2)] mb-1">
      <span className="font-medium">{label}</span>
      <span>{value}% fit</span>
    </div>
    <div className="h-2 rounded-full bg-[var(--day-inset)] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, delay, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </div>
);

/** 1 — Career Compass dashboard */
export const CompassShot = () => (
  <div className="bg-[#FDFAF3] p-5 min-h-[400px] flex flex-col">
    <div className="flex items-center justify-between mb-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--day-ink-3)] font-semibold">
        Your Career Compass
      </p>
      <span className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#F4C660]/60">
        <Image
          src={KAI_SRC_SM}
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="w-full h-full object-cover object-top"
        />
      </span>
    </div>

    <div className="rounded-2xl bg-gradient-to-br from-[#221248] to-[#08051A] px-4 py-4 mb-5 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-[#14101F]">
        <WayCatalyst size={22} />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#C8B6F0]">
          Operational archetype
        </p>
        <p className="font-heading font-semibold text-[#F5EEE6]">
          The Catalyst
        </p>
      </div>
    </div>

    <p className="text-xs font-semibold text-[var(--day-ink-2)] mb-2.5">
      Top clusters
    </p>
    <Bar label="Technology" value={92} color="#B07A18" />
    <Bar label="Arts / Media" value={84} color="#6D5BA8" delay={0.15} />
    <Bar label="Business" value={71} color="#3D8A73" delay={0.3} />

    <div className="mt-auto flex flex-wrap gap-2 pt-3">
      {COMPASS_DETAILS.map(([k, v, Icon]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--day-inset)] px-3 py-1.5 text-xs text-[var(--day-ink-2)]"
        >
          <Icon size={13} />
          <span className="text-[var(--day-ink-3)]">{k}:</span>{" "}
          <strong>{v}</strong>
        </span>
      ))}
    </div>
  </div>
);

/** 2 — Narrative Report page */
export const ReportShot = () => (
  <div className="bg-[#FDFAF3] p-6 min-h-[400px] flex flex-col">
    <div className="flex items-center justify-between mb-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--day-ink-3)] font-semibold">
        Narrative Report
      </p>
      <span className="text-[10px] text-[var(--day-ink-3)]">p. 2 of 6</span>
    </div>

    <h4 className="font-heading text-xl font-semibold text-[var(--day-ink)] leading-snug mb-3">
      Why fast-moving worlds suit you
    </h4>

    <p className="text-[13px] leading-relaxed text-[var(--day-ink-2)]">
      Your answers show a clear pattern: you commit deeply once something earns
      your attention, but rigid routines drain you.{" "}
      <mark className="bg-[#F4C660]/40 text-[var(--day-ink)] rounded px-0.5">
        Careers that reward adaptability — startups, product teams, newsrooms —
        will keep you engaged
      </mark>{" "}
      far longer than roles built on repetition.
    </p>

    <div className="my-4 h-px bg-[var(--day-line)]" />

    <p className="text-[13px] leading-relaxed text-[var(--day-ink-2)]">
      In your top cluster, Technology, that points toward roles like product
      management and developer relations rather than long-cycle maintenance
      work.
    </p>

    <div className="mt-auto pt-4 flex items-start gap-2.5">
      <span className="w-8 h-8 shrink-0 rounded-full overflow-hidden ring-1 ring-[#F4C660]/60">
        <Image
          src={KAI_SRC_SM}
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="w-full h-full object-cover object-top"
        />
      </span>
      <p className="font-hand text-lg leading-snug text-[#B07A18] -rotate-1">
        the 2am-project feeling? That’s this paragraph. — Kai
      </p>
    </div>
  </div>
);

/** 3 — Shareable result card */
export const CardShot = () => (
  <div className="bg-[#FDFAF3] p-5 min-h-[400px] flex flex-col">
    <div className="rounded-2xl overflow-hidden border border-[var(--day-line)] shadow-sm">
      <div className="bg-dusk-band px-4 pt-5 pb-4 text-center">
        <p className="font-heading text-lg font-semibold text-[#F5EEE6] leading-none">
          Layla’s Path
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#F5EEE6]/70">
          Tareeq result card · 17 · UAE
        </p>
      </div>
      <div className="bg-white px-4 py-4">
        <div className="flex justify-center gap-1.5 mb-3">
          {["Technology", "Arts/Media", "Business"].map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                i === 0
                  ? "bg-[#F4C660]/50 text-[#7A4A21]"
                  : "bg-[var(--day-inset)] text-[var(--day-ink-2)]"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Archetype", "Catalyst"],
            ["Driver", "Impact"],
            ["Ecosystem", "Dynamic"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl bg-[var(--day-inset)]/70 px-1.5 py-2"
            >
              <p className="text-[9px] uppercase tracking-wide text-[var(--day-ink-3)]">
                {k}
              </p>
              <p className="text-[11px] font-semibold text-[var(--day-ink)]">
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-4 rounded-2xl bg-[var(--day-inset)]/60 px-4 py-3 text-center">
      <p className="text-xs text-[var(--day-ink-2)]">
        3 pages · download, print, or share with a link
      </p>
    </div>

    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className="mt-auto pointer-events-none rounded-full bg-gold-gradient text-[#14101F] px-5 py-2.5 text-sm font-semibold"
    >
      Share with family
    </button>
  </div>
);

export const PRODUCT_SHOTS: ReadonlyArray<ProductShot> = [
  {
    shot: CompassShot,
    tilt: -1.5,
    lift: "md:mt-10",
    title: "Career Compass",
    body: "Your top clusters, archetype, and drivers — at a glance.",
  },
  {
    shot: ReportShot,
    tilt: 0.75,
    lift: "",
    title: "Narrative Report",
    body: "What it means, in plain language, with real careers.",
  },
  {
    shot: CardShot,
    tilt: 1.5,
    lift: "md:mt-10",
    title: "Shareable Card",
    body: "A 3-page visual summary for family and counselors.",
  },
];

export { Frame as ShotFrame };
