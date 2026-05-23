import { useId, type SVGProps } from "react";

export type KaiMood =
  | "curious"
  | "warm"
  | "thinking"
  | "encouraging"
  | "listening";

interface KaiProps extends SVGProps<SVGSVGElement> {
  mood?: KaiMood;
  size?: number | string;
  /** Disable idle motion (breathing, blink, curl sway). Defaults to false. */
  still?: boolean;
  /** Use "wave" only for greeting moments, such as the intro. */
  gesture?: "none" | "wave";
  /** Audio-driven mouth openness, from 0 to 1. */
  mouthOpen?: number;
}

/**
 * Kai - Tareeq's mentor character.
 *
 * Rebuilt as a bust portrait rather than a waving full-body mascot. At
 * the small sizes used in the assessment screens, a cropped portrait
 * gives Kai more believable proportions and avoids uncanny hand/arm
 * anatomy.
 */
export function Kai({
  mood = "warm",
  size = 112,
  still = false,
  gesture = "none",
  mouthOpen = 0,
  ...rest
}: KaiProps) {
  const id = useId().replace(/:/g, "");
  const expression = MOODS[mood];
  const syncedMouth = getSyncedMouth(expression, mouthOpen);
  const bodyClass = still ? "" : "kai-breathe";
  const hairClass = still ? "" : "kai-hair-sway";
  const eyeClass = still ? "" : "kai-blink";
  const handClass = still || gesture !== "wave" ? "" : "kai-hand-wave";

  const skin = `kai-skin-${id}`;
  const skinLight = `kai-skin-light-${id}`;
  const hair = `kai-hair-${id}`;
  const shirt = `kai-shirt-${id}`;
  const shirtHem = `kai-shirt-hem-${id}`;
  const shirtDots = `kai-shirt-dots-${id}`;

  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id={skin} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F1CDA8" />
          <stop offset="100%" stopColor="#D09A74" />
        </linearGradient>

        <radialGradient id={skinLight} cx="0.35" cy="0.25" r="0.72">
          <stop offset="0%" stopColor="#F9E0C6" stopOpacity="0.7" />
          <stop offset="65%" stopColor="#F9E0C6" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={hair} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2B1A12" />
          <stop offset="100%" stopColor="#3C2418" />
        </linearGradient>

        <linearGradient id={shirt} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FF3D83" />
          <stop offset="52%" stopColor="#FF6B3D" />
          <stop offset="100%" stopColor="#FFA53D" />
        </linearGradient>

        <linearGradient id={shirtHem} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#A06EEA" />
          <stop offset="100%" stopColor="#6E48E4" />
        </linearGradient>

        <pattern
          id={shirtDots}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
        >
          <circle cx="2.5" cy="2.5" r="0.95" fill="#FDE7A8" opacity="0.58" />
          <circle cx="6.2" cy="6.1" r="0.8" fill="#F5EEE6" opacity="0.48" />
        </pattern>

        <style>{`
          @keyframes kai-breathe {
            0%, 100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(0.45px) scale(1.01); }
          }
          @keyframes kai-hair-sway {
            0%, 100% { transform: rotate(0deg); }
            50%      { transform: rotate(0.7deg); }
          }
          @keyframes kai-blink {
            0%, 92%, 100% { transform: scaleY(1); }
            94%, 98%      { transform: scaleY(0.08); }
          }
          @keyframes kai-hand-wave {
            0%, 100% { transform: rotate(0deg); }
            38%      { transform: rotate(-4deg); }
            72%      { transform: rotate(2.5deg); }
          }
          .kai-breathe {
            transform-origin: 64px 92px;
            animation: kai-breathe 4.2s ease-in-out infinite;
          }
          .kai-hair-sway {
            transform-origin: 64px 42px;
            animation: kai-hair-sway 6.4s ease-in-out infinite;
          }
          .kai-blink {
            transform-origin: center;
            transform-box: fill-box;
            animation: kai-blink 6.8s ease-in-out infinite;
          }
          .kai-hand-wave {
            transform-origin: 102px 67px;
            transform-box: view-box;
            animation: kai-hand-wave 3.2s ease-in-out 0.5s infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .kai-breathe, .kai-hair-sway, .kai-blink, .kai-hand-wave {
              animation: none;
            }
          }
        `}</style>
      </defs>

      <g className={bodyClass}>
        {/* Neck and shoulders are intentionally drawn before the head so
            Kai reads as a real bust portrait rather than a sticker head. */}
        <path
          d="M56 75 L56 92 C56 97 60 100 64 100 C68 100 72 97 72 92 L72 75 Z"
          fill={`url(#${skin})`}
        />
        <path
          d="M55 91 C58 95 61 97 64 97 C67 97 70 95 73 91"
          stroke="#7A4F36"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        <path
          d="M23 128 C24 108 37 94 52 91 L57 97 C61 101 67 101 71 97
             L76 91 C91 94 104 108 105 128 Z"
          fill={`url(#${shirt})`}
        />
        <path
          d="M23 118 L105 118 L105 128 L23 128 Z"
          fill={`url(#${shirtHem})`}
        />
        <path
          d="M23 128 C24 108 37 94 52 91 L57 97 C61 101 67 101 71 97
             L76 91 C91 94 104 108 105 128 Z"
          fill={`url(#${shirtDots})`}
        />
        <path
          d="M48 92 C54 101 74 101 80 92"
          stroke="#9C2D5A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {gesture === "wave" ? (
          /* Raised greeting arm, layered behind the head. Keeping the
             shoulder partly hidden makes the pose feel attached to the
             bust instead of pasted onto it. */
          <g>
            <path
              d="M76 94 C84 88 93 78 99 66 C101 63 105 64 106 67
                 C102 81 93 94 82 101 C78 101 75 98 76 94 Z"
              fill={`url(#${skin})`}
            />
            <path
              d="M81 96 C88 89 96 78 101 67"
              stroke="#A87654"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.26"
            />
            <g className={handClass}>
              <path
                d="M101 68 C103 60 103 51 100.5 43
                   C100 40.5 103.4 39.5 105 41.8
                   C109 51 108.8 62.5 105.2 70
                   C104.1 72.8 100.2 71 101 68 Z"
                fill={`url(#${skin})`}
              />
              <path
                d="M104 43 C106 51 106 61 103.2 69"
                stroke="#A87654"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.22"
              />
              <g transform="translate(103.5 39.5) rotate(7)">
                <g
                  stroke={`url(#${skin})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                >
                  <path d="M-5 -4 C-6.2 -8.8 -5.8 -12.7 -3.8 -14.4" />
                  <path d="M-1.4 -5 C-2.1 -10.4 -1 -14.8 1.2 -16.2" />
                  <path d="M2.7 -5 C2.8 -10.4 4.2 -14.3 6.2 -15.2" />
                  <path d="M6.7 -4 C7.6 -8.4 9.2 -11.3 11 -12" />
                </g>
                <path
                  d="M-8 -2 C-9.3 -7.5 -6.3 -11.2 -1.2 -11.5
                     L5.2 -10.8 C10 -10 12.4 -5.7 11.3 0.6
                     C10.4 6.2 6.1 9 0.7 8.8 C-5.1 8.5 -7.6 4 -8 -2 Z"
                  fill={`url(#${skin})`}
                />
                <path
                  d="M-7.4 -0.3 C-11.3 -0.3 -13.8 2.8 -12.7 6
                     C-11.5 9.2 -7.3 8.1 -5.7 4.3 C-5 2.6 -5.6 0.7 -7.4 -0.3 Z"
                  fill={`url(#${skin})`}
                />
                <path
                  d="M-5 -1.2 Q1.7 0.6 7.8 -0.8"
                  stroke="#A87654"
                  strokeWidth="0.55"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.25"
                />
                <path
                  d="M-2.8 -8.8 L-2.3 -12 M1.1 -9.2 L1.6 -13.1
                     M5.1 -8.8 L5.9 -12"
                  stroke="#A87654"
                  strokeWidth="0.62"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />
              </g>
            </g>
            <path
              d="M73 89 C79 86 89 90 93 97 C89 103 78 104 70 98 Z"
              fill={`url(#${shirt})`}
            />
            <path
              d="M73 89 C79 86 89 90 93 97 C89 103 78 104 70 98 Z"
              fill={`url(#${shirtDots})`}
              opacity="0.85"
            />
          </g>
        ) : null}

        <g transform={`rotate(${expression.tilt} 64 58)`}>
          <g className={hairClass}>
            <path
              d="M27 72 C18 56 21 33 33 20 C45 7 64 4 80 11
                 C96 18 104 35 101 57 C99 75 88 88 72 92 L56 92
                 C43 90 33 83 27 72 Z"
              fill={`url(#${hair})`}
            />
            <path
              d="M31 39 C35 20 49 9 65 9 C82 9 95 22 98 42
                 C88 36 76 29 64 28 C52 29 41 35 31 39 Z"
              fill={`url(#${hair})`}
            />
            <path
              d="M32 70 C23 58 24 37 32 25 C41 10 58 7 72 11
                 C90 16 100 31 98 52 C97 67 89 78 77 84
                 C80 76 82 68 82 57 C82 39 75 28 64 25
                 C53 28 45 39 45 57 C45 68 48 77 52 84
                 C44 82 37 77 32 70 Z"
              fill={`url(#${hair})`}
            />
            <circle cx="33" cy="37" r="11" fill={`url(#${hair})`} />
            <circle cx="41" cy="23" r="10" fill={`url(#${hair})`} />
            <circle cx="54" cy="15" r="10.5" fill={`url(#${hair})`} />
            <circle cx="68" cy="14" r="10" fill={`url(#${hair})`} />
            <circle cx="82" cy="22" r="10" fill={`url(#${hair})`} />
            <circle cx="92" cy="38" r="10.5" fill={`url(#${hair})`} />
            <circle cx="29" cy="54" r="9.5" fill={`url(#${hair})`} />
            <circle cx="96" cy="56" r="9.5" fill={`url(#${hair})`} />
            <circle cx="34" cy="73" r="8.5" fill={`url(#${hair})`} />
            <circle cx="88" cy="76" r="8.5" fill={`url(#${hair})`} />
            <circle
              cx="21"
              cy="58"
              r="5.2"
              fill={`url(#${hair})`}
              opacity="0.9"
            />
            <circle
              cx="103"
              cy="51"
              r="5"
              fill={`url(#${hair})`}
              opacity="0.9"
            />
            <circle cx="48" cy="16" r="3" fill="#513124" opacity="0.55" />
            <circle cx="75" cy="19" r="3" fill="#513124" opacity="0.55" />
            <circle cx="92" cy="42" r="2.8" fill="#513124" opacity="0.45" />
            <circle cx="30" cy="62" r="2.6" fill="#513124" opacity="0.45" />
          </g>

          <ellipse cx="41" cy="60" rx="4.2" ry="6" fill={`url(#${skin})`} />
          <ellipse cx="87" cy="60" rx="4.2" ry="6" fill={`url(#${skin})`} />

          <path
            d="M41 42 C41 27 51 19 64 19 C77 19 87 27 87 42 L87 58
               C87 76 77 87 64 87 C51 87 41 76 41 58 Z"
            fill={`url(#${skin})`}
          />
          <path
            d="M41 42 C41 27 51 19 64 19 C77 19 87 27 87 42 L87 58
               C87 76 77 87 64 87 C51 87 41 76 41 58 Z"
            fill={`url(#${skinLight})`}
          />

          <g fill={`url(#${hair})`}>
            <path
              d="M39 45 C38 29 49 16 64 15 C80 15 91 29 90 45
                 C83 38 78 38 74 42 C71 35 63 34 59 40
                 C55 36 50 37 47 43 C44 43 42 43 40 44 Z"
            />
            <path
              d="M42 39 C48 27 58 21 71 24 C64 27 59 32 56 39
                 C52 37 46 37 42 39 Z"
              opacity="0.95"
            />
            <circle cx="48" cy="32" r="5.8" />
            <circle cx="57" cy="27" r="5.7" />
            <circle cx="67" cy="27" r="5.4" />
            <circle cx="76" cy="33" r="5.4" />
          </g>

          <line
            x1="40.5"
            y1="63"
            x2="38.8"
            y2="70"
            stroke="#C68E3E"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <line
            x1="87.5"
            y1="63"
            x2="89.2"
            y2="70"
            stroke="#C68E3E"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <circle cx="40.5" cy="62.5" r="1.35" fill="#E8B95E" />
          <circle cx="38.8" cy="71" r="1.9" fill="#D9A23A" />
          <circle cx="87.5" cy="62.5" r="1.35" fill="#E8B95E" />
          <circle cx="89.2" cy="71" r="1.9" fill="#D9A23A" />

          <path
            d={expression.browL}
            stroke="#2A1A12"
            strokeWidth="2.7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={expression.browR}
            stroke="#2A1A12"
            strokeWidth="2.7"
            strokeLinecap="round"
            fill="none"
          />

          <g>
            <g className={eyeClass}>
              <ellipse
                cx="56"
                cy={expression.eyeY}
                rx="4.6"
                ry="2.8"
                fill="#FBF5EE"
              />
            </g>
            <g className={eyeClass}>
              <ellipse
                cx="72"
                cy={expression.eyeY}
                rx="4.6"
                ry="2.8"
                fill="#FBF5EE"
              />
            </g>
            <circle cx="56" cy={expression.eyeY} r="2.25" fill="#5A3520" />
            <circle cx="72" cy={expression.eyeY} r="2.25" fill="#5A3520" />
            <circle cx="56" cy={expression.eyeY} r="1.15" fill="#0F0824" />
            <circle cx="72" cy={expression.eyeY} r="1.15" fill="#0F0824" />
            <circle
              cx="56.8"
              cy={expression.eyeY - 0.8}
              r="0.72"
              fill="#FFFFFF"
            />
            <circle
              cx="72.8"
              cy={expression.eyeY - 0.8}
              r="0.72"
              fill="#FFFFFF"
            />
          </g>

          <path
            d={`M51.9 ${expression.eyeY - 3} Q56 ${expression.eyeY - 4} 60.1 ${expression.eyeY - 3}`}
            stroke="#2A1A12"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M67.9 ${expression.eyeY - 3} Q72 ${expression.eyeY - 4} 76.1 ${expression.eyeY - 3}`}
            stroke="#2A1A12"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />

          <path
            d="M64 51 C65 58 64 63 61.8 65"
            stroke="#7A4F36"
            strokeWidth="0.95"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />
          <circle
            cx="60.7"
            cy="65.4"
            r="1.25"
            fill="none"
            stroke="#E8B95E"
            strokeWidth="0.75"
          />
          <circle cx="59.8" cy="65" r="0.28" fill="#FDE7A8" />

          <g fill="#8A5635" opacity="0.62">
            <circle cx="57.3" cy="59.5" r="0.55" />
            <circle cx="60" cy="61.8" r="0.5" />
            <circle cx="68" cy="60.5" r="0.5" />
            <circle cx="70.6" cy="63" r="0.55" />
            <circle cx="54.5" cy="68" r="0.52" />
            <circle cx="73.2" cy="68.2" r="0.52" />
          </g>

          <ellipse
            cx="51.5"
            cy="68"
            rx="4.2"
            ry="2.2"
            fill="#C56548"
            opacity={expression.blushOpacity}
          />
          <ellipse
            cx="76.5"
            cy="68"
            rx="4.2"
            ry="2.2"
            fill="#C56548"
            opacity={expression.blushOpacity}
          />

          <path
            d={syncedMouth.path}
            stroke="#8E3F37"
            strokeWidth={syncedMouth.isOpen ? "1.25" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={syncedMouth.fill}
          />
          {syncedMouth.isOpen ? (
            <path
              d={syncedMouth.tonguePath}
              fill="#F2A8B3"
              opacity={0.42 + syncedMouth.open * 0.2}
            />
          ) : expression.mouthFill ? (
            <path
              d={syncedMouth.path}
              stroke="#F2A8B3"
              strokeWidth="0.65"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
              transform="translate(0, 0.8)"
            />
          ) : null}
        </g>
      </g>
    </svg>
  );
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function getSyncedMouth(expression: Expression, rawOpen: number) {
  const open = clamp01(rawOpen);
  if (open < 0.08) {
    return {
      path: expression.mouth,
      fill: expression.mouthFill ?? "none",
      isOpen: false,
      open,
      tonguePath: "",
    };
  }

  const left = 56.5 - open * 1.2;
  const right = 71.5 + open * 1.2;
  const top = 73.5 - open * 1.2;
  const bottom = 75.2 + open * 4.4;
  const mid = (top + bottom) / 2;
  const tongueTop = bottom - 1.4 - open * 0.45;

  return {
    path:
      `M${left.toFixed(2)} ${mid.toFixed(2)} ` +
      `C${left.toFixed(2)} ${top.toFixed(2)} ${right.toFixed(2)} ${top.toFixed(2)} ${right.toFixed(2)} ${mid.toFixed(2)} ` +
      `C${right.toFixed(2)} ${bottom.toFixed(2)} ${left.toFixed(2)} ${bottom.toFixed(2)} ${left.toFixed(2)} ${mid.toFixed(2)} Z`,
    fill: "#6F2D32",
    isOpen: true,
    open,
    tonguePath:
      `M${(left + 2.2).toFixed(2)} ${tongueTop.toFixed(2)} ` +
      `C${(left + 4.7).toFixed(2)} ${(bottom + 0.4).toFixed(2)} ${(right - 4.7).toFixed(2)} ${(bottom + 0.4).toFixed(2)} ${(right - 2.2).toFixed(2)} ${tongueTop.toFixed(2)} ` +
      `C${(right - 4.2).toFixed(2)} ${(bottom - 0.4).toFixed(2)} ${(left + 4.2).toFixed(2)} ${(bottom - 0.4).toFixed(2)} ${(left + 2.2).toFixed(2)} ${tongueTop.toFixed(2)} Z`,
  };
}

type Expression = {
  tilt: number;
  eyeY: number;
  browL: string;
  browR: string;
  mouth: string;
  mouthFill?: string;
  blushOpacity: number;
};

const MOODS: Record<KaiMood, Expression> = {
  curious: {
    tilt: 1.5,
    eyeY: 50,
    browL: "M50 42 Q56 38.8 61 42",
    browR: "M67 42 Q72 38.8 78 42",
    mouth: "M57 75 Q64 78.2 71 75",
    blushOpacity: 0.28,
  },
  warm: {
    tilt: -0.8,
    eyeY: 51,
    browL: "M50 43 Q56 41 61 43",
    browR: "M67 43 Q72 41 78 43",
    mouth: "M55.5 74 Q64 81 72.5 74",
    mouthFill: "#D27567",
    blushOpacity: 0.34,
  },
  thinking: {
    tilt: -2,
    eyeY: 50,
    browL: "M50 42.5 Q56 40 61 42.5",
    browR: "M67 40.5 Q72 38 78 41.5",
    mouth: "M59 76 Q64 77 69 75.8",
    blushOpacity: 0.24,
  },
  encouraging: {
    tilt: 1,
    eyeY: 51,
    browL: "M50 41.8 Q56 40 61 42",
    browR: "M67 41.8 Q72 40 78 42",
    mouth: "M55 74 Q64 82 73 74",
    mouthFill: "#D27567",
    blushOpacity: 0.38,
  },
  listening: {
    tilt: 2,
    eyeY: 51,
    browL: "M50 43 Q56 41.5 61 43",
    browR: "M67 43 Q72 41.5 78 43",
    mouth: "M58 76 Q64 78.5 70 76",
    blushOpacity: 0.27,
  },
};
