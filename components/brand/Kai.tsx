import type { SVGProps } from "react";

export type KaiMood =
  | "curious"
  | "warm"
  | "thinking"
  | "encouraging"
  | "listening";

interface KaiProps extends SVGProps<SVGSVGElement> {
  mood?: KaiMood;
  size?: number | string;
}

/**
 * Kai — Tareeq's mentor character.
 *
 * A woman in her late thirties / early forties. Career-counselor energy:
 * warm, confident, sophisticated. Earth-tone palette (deep walnut hair
 * with a discreet grey streak at the temple, warm beige skin, deep
 * camel top). The only brand-cyan cue is a single small earring stud —
 * mature jewelry, signature preserved.
 *
 * Renders cleanly on a transparent background — the previous coral box
 * is gone; the surrounding wrapper provides a soft atmospheric glow
 * instead of a hard-edged container.
 *
 * Same five-mood API: `curious · warm · thinking · encouraging · listening`.
 */
export function Kai({ mood = "warm", size = 112, ...rest }: KaiProps) {
  const expression = MOODS[mood];

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="kai-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#EFD3B4" />
          <stop offset="100%" stopColor="#D7AE85" />
        </linearGradient>
        <linearGradient id="kai-hair" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#322318" />
          <stop offset="100%" stopColor="#1B120B" />
        </linearGradient>
        <linearGradient id="kai-bandana" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5B3D8C" />
          <stop offset="100%" stopColor="#3D2270" />
        </linearGradient>
        <linearGradient id="kai-top" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9B5E3F" />
          <stop offset="100%" stopColor="#724330" />
        </linearGradient>
        {/* Small dotted pattern on the bandana fabric. */}
        <pattern
          id="kai-bandana-dots"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
        >
          <circle cx="3" cy="3" r="0.7" fill="#F5EEE6" opacity="0.38" />
          <circle cx="0" cy="0" r="0.7" fill="#F5EEE6" opacity="0.38" />
          <circle cx="6" cy="0" r="0.7" fill="#F5EEE6" opacity="0.38" />
          <circle cx="0" cy="6" r="0.7" fill="#F5EEE6" opacity="0.38" />
          <circle cx="6" cy="6" r="0.7" fill="#F5EEE6" opacity="0.38" />
        </pattern>
      </defs>

      <g transform={`rotate(${expression.tilt} 48 50)`}>
        {/* Camel V-neck top */}
        <path
          d="M14 92 C 14 80 22 72 32 70
             L 40 76 L 48 82 L 56 76 L 64 70
             C 74 72 82 80 82 92 L 82 100 L 14 100 Z"
          fill="url(#kai-top)"
        />

        {/* Neck */}
        <path
          d="M42 64 L42 72 C 42 75 45 77 48 77 C 51 77 54 75 54 72 L 54 64 Z"
          fill="url(#kai-skin)"
        />

        {/* Hair — short bob silhouette, full crown + sides visible.
         *  No bangs cut on this version; the bandana below covers the
         *  forehead band, so the hair just needs to frame the head. */}
        <path
          d="M 22 52
             C 18 28 32 10 48 10
             C 64 10 78 28 74 52
             Q 72 55 64 53
             C 64 48 62 44 60 42
             C 60 30 54 24 48 24
             C 42 24 36 30 36 42
             C 34 44 32 48 32 53
             Q 24 55 22 52
             Z"
          fill="url(#kai-hair)"
        />

        {/* Face — oval, drawn on top of hair so it shows through */}
        <path
          d="M30 38 C 30 26 38 20 48 20 C 58 20 66 26 66 38 L 66 52
             C 66 62 58 68 48 68 C 38 68 30 62 30 52 Z"
          fill="url(#kai-skin)"
        />

        {/* Bandana — narrow patterned band across the forehead.
         *  Hair shows above (the crown) and below would be the brows.
         *  Slight upward arch follows the curve of the head. */}
        <path
          d="M 20 38
             Q 24 26 32 24
             Q 48 20 64 24
             Q 72 26 76 38
             Q 72 40 68 40
             Q 48 42 28 40
             Q 24 40 20 38
             Z"
          fill="url(#kai-bandana)"
        />
        {/* Pattern overlay on the bandana */}
        <path
          d="M 20 38
             Q 24 26 32 24
             Q 48 20 64 24
             Q 72 26 76 38
             Q 72 40 68 40
             Q 48 42 28 40
             Q 24 40 20 38
             Z"
          fill="url(#kai-bandana-dots)"
        />
        {/* Bandana inner-edge fold — subtle darker line along the bottom */}
        <path
          d="M 22 38 Q 48 42 74 38"
          stroke="#2A1758"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* Side knot — tiny tied detail on the right side */}
        <path
          d="M 74 30 Q 80 28 82 32 Q 78 34 74 33 Z"
          fill="url(#kai-bandana)"
        />

        {/* Eyebrows — defined, slightly arched */}
        <path
          d={expression.browL}
          stroke="#322318"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={expression.browR}
          stroke="#322318"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes — almond shape with brown iris */}
        <g>
          <ellipse
            cx="40"
            cy={expression.eyeY}
            rx="3.2"
            ry="2.2"
            fill="#FFFFFF"
          />
          <ellipse
            cx="56"
            cy={expression.eyeY}
            rx="3.2"
            ry="2.2"
            fill="#FFFFFF"
          />
          {/* iris */}
          <circle cx="40" cy={expression.eyeY} r="1.8" fill="#4A2E1C" />
          <circle cx="56" cy={expression.eyeY} r="1.8" fill="#4A2E1C" />
          {/* pupil */}
          <circle cx="40" cy={expression.eyeY} r="0.9" fill="#0F0824" />
          <circle cx="56" cy={expression.eyeY} r="0.9" fill="#0F0824" />
          {/* highlight */}
          <circle
            cx="40.7"
            cy={expression.eyeY - 0.6}
            r="0.5"
            fill="#FFFFFF"
          />
          <circle
            cx="56.7"
            cy={expression.eyeY - 0.6}
            r="0.5"
            fill="#FFFFFF"
          />
        </g>

        {/* Upper lash hint */}
        <path
          d={`M37 ${expression.eyeY - 2.2} Q40 ${expression.eyeY - 3} 43 ${expression.eyeY - 2.2}`}
          stroke="#322318"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M53 ${expression.eyeY - 2.2} Q56 ${expression.eyeY - 3} 59 ${expression.eyeY - 2.2}`}
          stroke="#322318"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
        />

        {/* Nose hint — subtle line */}
        <path
          d="M48 46 Q49 50 48 52"
          stroke="#B68662"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Cheek warmth — natural rose */}
        <ellipse
          cx="35"
          cy={expression.eyeY + 10}
          rx="3"
          ry="1.8"
          fill="#D78670"
          opacity="0.35"
        />
        <ellipse
          cx="61"
          cy={expression.eyeY + 10}
          rx="3"
          ry="1.8"
          fill="#D78670"
          opacity="0.35"
        />

        {/* Lips — soft warm rose */}
        <path
          d={expression.mouth}
          stroke="#9C4F44"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill={expression.mouthFill ?? "none"}
        />
      </g>
    </svg>
  );
}

type Expression = {
  tilt: number;
  eyeY: number;
  browL: string;
  browR: string;
  mouth: string;
  mouthFill?: string;
};

const MOODS: Record<KaiMood, Expression> = {
  curious: {
    tilt: 2,
    eyeY: 42,
    browL: "M34 34 Q40 31 44 34",
    browR: "M52 34 Q56 31 62 34",
    mouth: "M43 56 Q48 59 53 56",
  },
  warm: {
    tilt: -1,
    eyeY: 43,
    browL: "M34 35 Q40 33 44 35",
    browR: "M52 35 Q56 33 62 35",
    mouth: "M41 55 Q48 60 55 55",
    mouthFill: "#C8635A",
  },
  thinking: {
    tilt: -3,
    eyeY: 41,
    browL: "M34 34 Q40 32 44 35",
    browR: "M52 35 Q56 32 62 34",
    mouth: "M43 58 L53 58",
  },
  encouraging: {
    tilt: 1,
    eyeY: 41,
    browL: "M34 32 Q40 29 44 32",
    browR: "M52 32 Q56 29 62 32",
    mouth: "M41 55 Q48 61 55 55",
    mouthFill: "#C8635A",
  },
  listening: {
    tilt: 0,
    eyeY: 42,
    browL: "M34 35 Q40 34 44 35",
    browR: "M52 35 Q56 34 62 35",
    mouth: "M44 57 Q48 59 52 57",
  },
};
