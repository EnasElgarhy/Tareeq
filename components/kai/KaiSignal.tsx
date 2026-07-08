import type { KaiMood } from "@/components/brand/Kai";

interface KaiSignalProps {
  mood: KaiMood;
  /** Rendered footprint, in px. */
  size?: number;
}

/**
 * Kai's presence in small, secondary moments — badges, empty states,
 * locked cards, milestone markers — where mounting the real chroma-key
 * video (components/brand/Kai.tsx) is overkill. Deliberately not a face:
 * an abstract glow-mark that carries mood through motion and color, the
 * same way the Siri/Assistant orb "speaks" without ever drawing eyes.
 * Shares `KaiMood` with the real video so both read as the same Kai.
 */
export function KaiSignal({ mood, size = 40 }: KaiSignalProps) {
  const coreSize = Math.round(size * 0.7);
  const dotSize = Math.max(3, Math.round(size * 0.12));

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, position: "relative", display: "inline-grid", placeItems: "center" }}
    >
      <span
        className="kai-signal"
        data-mood={mood}
        style={{ width: coreSize, height: coreSize }}
      />
      <span className="kai-signal__ring" style={{ width: coreSize, height: coreSize }} />

      {mood === "thinking" || mood === "curious" ? (
        <span className="kai-signal__satellite">
          <span style={{ width: dotSize, height: dotSize }} />
        </span>
      ) : null}

      {mood === "success" ? (
        <svg
          width={Math.round(size * 0.42)}
          height={Math.round(size * 0.42)}
          viewBox="0 0 20 20"
          style={{ position: "absolute" }}
        >
          <path
            className="kai-signal__check"
            d="M5 10.5 L8.5 14 L15 6.5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
