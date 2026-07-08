"use client";

import { useEffect, useState, type CSSProperties } from "react";

interface CelebrationBurstProps {
  title: string;
  subtitle: string;
  onDone?: () => void;
}

const PARTICLES: Array<{ px: number; py: number; color: string; delay?: number }> = [
  { px: -34, py: -22, color: "var(--gold)" },
  { px: 34, py: -20, color: "#FF6B3D", delay: 0.08 },
  { px: -30, py: 26, color: "var(--violet-soft)", delay: 0.16 },
  { px: 30, py: 28, color: "var(--mint)", delay: 0.24 },
  { px: 0, py: -40, color: "var(--gold)", delay: 0.32 },
];

/**
 * A one-time completion moment — there was no prior pattern for this
 * anywhere in the app; a finished module used to just swap to a static
 * "Done" badge. Plays once, then calls onDone so the caller can retire it
 * (see lib/kai/celebration.ts for the seen-flag that keeps it from
 * replaying on every visit).
 */
export function CelebrationBurst({ title, subtitle, onDone }: CelebrationBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="anim-screen-enter flex flex-col items-center gap-3 rounded-[22px] border border-carbon/8 bg-white p-6 text-center shadow-[0_16px_36px_rgba(43,36,28,0.10)]">
      <div className="relative size-[76px]">
        <div
          className="grid size-full place-items-center rounded-full"
          style={{
            background: "linear-gradient(150deg,#40C4A4,#6FE0C0)",
            boxShadow: "0 14px 30px rgba(111,224,192,0.4)",
            animation: "celebration-badge-pop 0.5s var(--ease-standard) both",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 20 20">
            <path
              d="M5 10.5 L8.5 14 L15 6.5"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {PARTICLES.map((p, i) => (
          <i
            key={i}
            aria-hidden
            style={
              {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: p.color,
                "--px": `${p.px}px`,
                "--py": `${p.py}px`,
                animation: `celebration-particle-fly 1.4s ease-out ${p.delay ?? 0}s both`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div>
        <p className="text-[14px] font-black text-carbon">{title}</p>
        <p className="mt-0.5 text-[12px] text-carbon/55">{subtitle}</p>
      </div>
    </div>
  );
}
