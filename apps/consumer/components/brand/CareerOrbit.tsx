import { StudentPortrait } from "@/components/brand/StudentPortrait";

/**
 * CareerOrbit — the hero illustration for the start screen.
 *
 * A central compass surrounded by floating career-path tag chips. The
 * compass is the assessment; the tags are the paths it can find. Dotted
 * orbit rings, ambient stars, and gentle drift animations keep the scene
 * feeling alive without distracting from the page's CTA.
 *
 * Pure vector — no rasters, no real people, no third-party assets.
 */

type Tone = "coral" | "cyan" | "cream" | "lavender" | "coral-glow";
type Drift = "a" | "b" | "c";

interface CareerTag {
  label: string;
  tone: Tone;
  drift: Drift;
  /** Position within the 360×220 viewport, expressed as inline style. */
  pos: React.CSSProperties;
}

/**
 * Tag set — six MENA-relevant career paths covering the four CORE clusters
 * (TECH, ART, PPL, SCI, BUS, ENG). Curated for both breadth and resonance.
 */
const TAGS: ReadonlyArray<CareerTag> = [
  { label: "Doctor", tone: "coral", drift: "a", pos: { top: "6%", left: "16%" } },
  { label: "Designer", tone: "cyan", drift: "b", pos: { top: "2%", right: "12%" } },
  { label: "Engineer", tone: "cream", drift: "c", pos: { top: "30%", right: "-2%" } },
  { label: "Filmmaker", tone: "lavender", drift: "a", pos: { bottom: "26%", right: "-4%" } },
  { label: "Educator", tone: "coral-glow", drift: "b", pos: { bottom: "4%", right: "20%" } },
  { label: "Founder", tone: "cyan", drift: "c", pos: { bottom: "0%", left: "22%" } },
  { label: "Researcher", tone: "cream", drift: "a", pos: { bottom: "30%", left: "-4%" } },
  { label: "Architect", tone: "lavender", drift: "b", pos: { top: "30%", left: "-2%" } },
];

const TONE_CLASSES: Record<Tone, string> = {
  coral: "bg-coral text-cream",
  "coral-glow": "bg-coral-glow text-plum-deep",
  cyan: "bg-cyan-brand text-plum-deep",
  cream: "bg-cream text-plum",
  lavender: "bg-lavender-mist text-plum",
};

export function CareerOrbit() {
  return (
    <div
      role="img"
      aria-label="A compass surrounded by floating career paths — doctor, designer, engineer, filmmaker, educator, founder, researcher, architect"
      className="relative mx-auto h-[240px] w-full max-w-[360px]"
    >
      {/* Background orbits + ambient stars */}
      <svg
        viewBox="0 0 360 240"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B47" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#FF6B47" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#FF6B47" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* central ambient glow */}
        <circle cx="180" cy="120" r="110" fill="url(#orbit-glow)" />

        {/* slowly-rotating dotted orbit ring */}
        <g
          className="anim-orbit-spin"
          style={{ transformOrigin: "180px 120px" }}
        >
          <circle
            cx="180"
            cy="120"
            r="92"
            stroke="#F5EEE6"
            strokeOpacity="0.14"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2 7"
          />
        </g>
        {/* inner static orbit */}
        <circle
          cx="180"
          cy="120"
          r="64"
          stroke="#5BD6E8"
          strokeOpacity="0.18"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3 5"
        />

        {/* ambient stars */}
        {[
          [40, 30, 1.2, 0.55],
          [320, 36, 1.5, 0.6],
          [344, 188, 1.2, 0.45],
          [18, 200, 1.4, 0.5],
          [180, 18, 1, 0.45],
          [180, 222, 1, 0.4],
          [60, 130, 1.1, 0.4],
          [300, 130, 1.1, 0.4],
        ].map(([cx, cy, r, op], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="#F5EEE6"
            opacity={op}
          />
        ))}
        {/* one cyan signature sparkle */}
        <circle cx="284" cy="60" r="2" fill="#5BD6E8" />
        <circle cx="284" cy="60" r="5" fill="#5BD6E8" opacity="0.25" />
      </svg>

      {/* Central student — the user, surrounded by paths.
       *  Two wrappers: the outer owns the absolute centering transform;
       *  the inner owns the bob + entrance animations so their
       *  transforms don't clobber the centering. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="anim-avatar-in anim-avatar-bob drop-shadow-[0_12px_28px_rgba(15,8,36,0.55)]">
          <StudentPortrait variant="curly" size={148} />
        </div>
      </div>

      {/* Floating tags — the career paths.
       *  Outer span owns the absolute position + the one-shot enter animation.
       *  Inner span owns the infinite drift loop. Composing them on two
       *  elements avoids transform-property conflicts between the two
       *  animations. */}
      {TAGS.map((tag, i) => (
        <span
          key={tag.label}
          style={{ ...tag.pos, animationDelay: `${i * 90}ms` }}
          className="anim-tag-enter absolute"
        >
          <span
            className={[
              `anim-tag-float-${tag.drift}`,
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1",
              "text-[11px] font-semibold tracking-[0.005em]",
              "shadow-[0_6px_18px_rgba(15,8,36,0.45)] ring-1 ring-white/15",
              TONE_CLASSES[tag.tone],
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="size-1 rounded-full bg-current opacity-70"
            />
            {tag.label}
          </span>
        </span>
      ))}
    </div>
  );
}
