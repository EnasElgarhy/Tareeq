import type { SVGProps } from "react";

/**
 * StudentPortrait — Tareeq's flat line-art character set.
 *
 * Drawn in the spirit of friendly, hand-drawn editorial illustration:
 * a soft coral wash backdrop, single-stroke cream linework on top,
 * minimal facial detail (dot eyes, gentle smile, blush), and one cyan
 * signature sparkle to tie back to the brand mark.
 *
 * Three variants today — curly, hijab, bun — keep them culturally
 * inclusive and visually distinct enough that they could be used as
 * persona stand-ins across the result screen later.
 */

export type StudentVariant = "curly" | "hijab" | "bun";

interface StudentPortraitProps extends SVGProps<SVGSVGElement> {
  variant?: StudentVariant;
  size?: number | string;
  /** Hide the soft coral wash blob behind the character. */
  bare?: boolean;
}

const CREAM = "#F5EEE6";
const CORAL = "#FF6B47";
const CORAL_GLOW = "#FF8252";
const BLUSH = "#FFB098";
const INK = "#0F0824";
const CYAN = "#5BD6E8";

export function StudentPortrait({
  variant = "curly",
  size = 140,
  bare = false,
  ...rest
}: StudentPortraitProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="sp-wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CORAL_GLOW} />
          <stop offset="100%" stopColor={CORAL} />
        </linearGradient>
        {/* a soft inner highlight to give the wash dimension */}
        <radialGradient id="sp-glow" cx="38%" cy="28%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hand-drawn coral wash backdrop (slightly irregular blob) */}
      {!bare ? (
        <>
          <path
            d="M48 14 Q90 4 122 22 Q146 48 138 96 Q124 140 84 142 Q40 138 26 100 Q18 50 48 14 Z"
            fill="url(#sp-wash)"
          />
          <path
            d="M48 14 Q90 4 122 22 Q146 48 138 96 Q124 140 84 142 Q40 138 26 100 Q18 50 48 14 Z"
            fill="url(#sp-glow)"
          />
          {/* tiny sketchy texture marks for hand-drawn feel */}
          <g
            stroke={CREAM}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.18"
          >
            <path d="M40 36 L36 42" />
            <path d="M130 50 L134 56" />
            <path d="M34 110 L30 116" />
            <path d="M132 116 L136 122" />
          </g>
        </>
      ) : null}

      {/* Character — variant-specific */}
      {variant === "curly" ? <CurlyStudent /> : null}
      {variant === "hijab" ? <HijabStudent /> : null}
      {variant === "bun" ? <BunStudent /> : null}

      {/* Cyan signature sparkle — small floating mark above the head */}
      <g transform={SPARKLE_POS[variant]}>
        <path
          d="M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4 Z"
          fill={CYAN}
        />
        <circle cx="0" cy="0" r="6" fill={CYAN} opacity="0.18" />
      </g>
    </svg>
  );
}

const SPARKLE_POS: Record<StudentVariant, string> = {
  curly: "translate(126 22)",
  hijab: "translate(128 28)",
  bun: "translate(124 20)",
};

// =====================================================================
// Variants
// =====================================================================

function CurlyStudent() {
  return (
    <g
      stroke={CREAM}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Hair — cluster of curl blobs forming a recognizable mass */}
      <path
        d="M50 56 C44 38 56 24 70 24 C76 18 86 18 92 24 C108 22 120 36 116 56"
        fill={INK}
        stroke="none"
      />
      <g fill={INK} stroke="none">
        <circle cx="50" cy="50" r="7" />
        <circle cx="58" cy="38" r="8" />
        <circle cx="70" cy="30" r="8" />
        <circle cx="82" cy="28" r="8" />
        <circle cx="94" cy="32" r="8" />
        <circle cx="106" cy="42" r="7" />
        <circle cx="112" cy="54" r="6" />
        <circle cx="48" cy="60" r="5" />
      </g>

      {/* Face oval */}
      <path d="M58 58 C58 80 64 96 82 96 C100 96 106 80 106 58" />

      {/* Cheek blush */}
      <ellipse
        cx="66"
        cy="80"
        rx="4"
        ry="2.2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />
      <ellipse
        cx="98"
        cy="80"
        rx="4"
        ry="2.2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />

      {/* Eyes — simple dots */}
      <circle cx="72" cy="72" r="2.4" fill={CREAM} stroke="none" />
      <circle cx="92" cy="72" r="2.4" fill={CREAM} stroke="none" />

      {/* Smile */}
      <path d="M74 86 Q82 92 90 86" />

      {/* Neck + shoulders */}
      <path d="M74 96 V104" />
      <path d="M90 96 V104" />
      <path d="M70 104 C46 110 38 124 36 146" />
      <path d="M94 104 C118 110 126 124 128 146" />

      {/* Shirt collar V */}
      <path d="M76 106 L82 116 L88 106" />

      {/* Horizontal stripe shirt detail */}
      <line x1="40" y1="132" x2="124" y2="132" opacity="0.7" />
      <line x1="38" y1="140" x2="126" y2="140" opacity="0.5" />
    </g>
  );
}

function HijabStudent() {
  return (
    <g
      stroke={CREAM}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Hijab — soft enclosed shape that wraps the head and shoulders */}
      <path
        d="M44 56 C44 30 60 18 82 18 C104 18 120 30 120 56 V72 C120 92 108 108 92 110
           C92 116 96 122 100 124
           C92 126 80 126 72 124
           C76 122 80 116 80 110
           C64 108 44 92 44 72 Z"
        fill={INK}
        stroke="none"
      />

      {/* Face cutout */}
      <path
        d="M58 56 C58 76 64 90 82 90 C100 90 106 76 106 56 C100 50 92 48 82 48 C72 48 64 50 58 56 Z"
        fill={CREAM}
        stroke="none"
      />

      {/* Cheek blush */}
      <ellipse
        cx="66"
        cy="74"
        rx="3.5"
        ry="2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />
      <ellipse
        cx="98"
        cy="74"
        rx="3.5"
        ry="2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />

      {/* Eyes */}
      <circle cx="72" cy="66" r="2.4" fill={INK} stroke="none" />
      <circle cx="92" cy="66" r="2.4" fill={INK} stroke="none" />

      {/* Smile */}
      <path d="M74 80 Q82 86 90 80" stroke={INK} />

      {/* Body — soft shoulders */}
      <path d="M58 124 C44 128 36 134 34 148" />
      <path d="M106 124 C120 128 128 134 130 148" />
    </g>
  );
}

function BunStudent() {
  return (
    <g
      stroke={CREAM}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Top knot bun */}
      <circle cx="82" cy="20" r="10" fill={INK} stroke="none" />
      <path d="M76 26 Q82 22 88 26" stroke={INK} />

      {/* Hair shape */}
      <path
        d="M52 60 C46 38 60 28 82 28 C104 28 118 38 112 60 C108 70 100 74 96 70
           C94 64 92 60 82 60 C72 60 68 64 66 70 C62 74 56 70 52 60 Z"
        fill={INK}
        stroke="none"
      />

      {/* Face oval */}
      <path d="M58 60 C58 82 66 98 82 98 C98 98 106 82 106 60" />

      {/* Cheek blush */}
      <ellipse
        cx="66"
        cy="82"
        rx="4"
        ry="2.2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />
      <ellipse
        cx="98"
        cy="82"
        rx="4"
        ry="2.2"
        fill={BLUSH}
        stroke="none"
        opacity="0.85"
      />

      {/* Eyes */}
      <circle cx="72" cy="74" r="2.4" fill={CREAM} stroke="none" />
      <circle cx="92" cy="74" r="2.4" fill={CREAM} stroke="none" />

      {/* Smile */}
      <path d="M74 88 Q82 94 90 88" />

      {/* Neck + shoulders */}
      <path d="M74 98 V106" />
      <path d="M90 98 V106" />
      <path d="M70 106 C46 112 38 126 36 146" />
      <path d="M94 106 C118 112 126 126 128 146" />

      {/* Crewneck collar */}
      <path d="M70 108 Q82 116 94 108" />

      {/* Subtle shirt fold */}
      <line x1="42" y1="138" x2="124" y2="138" opacity="0.5" />
    </g>
  );
}
