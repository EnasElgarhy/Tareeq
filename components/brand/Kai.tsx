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
  /** Disable idle motion (breathing, blink, curl sway). Defaults to false. */
  still?: boolean;
}

/**
 * Kai — Tareeq's mentor character.
 *
 * A woman in her early thirties with voluminous dark curly hair, warm
 * brown skin, a small gold nose ring, dangling brass earrings, and a
 * colorful printed crewneck. Designed to read as a real person —
 * present, attentive, slightly playful — rather than a generic mascot.
 *
 * Renders on transparent background. The surrounding wrapper provides
 * the atmospheric glow.
 *
 * Public API preserved: same five-mood expression set (curious · warm ·
 * thinking · encouraging · listening) and `size` prop. New optional
 * `still` prop disables idle motion (used for static / brand exports).
 *
 * Idle motion is CSS-driven and respects `prefers-reduced-motion`:
 *   • subtle breathing (whole body, 4s cycle)
 *   • soft curl sway (hair only, 6s cycle)
 *   • occasional blink (eyes, 7s cycle)
 */
export function Kai({ mood = "warm", size = 112, still = false, ...rest }: KaiProps) {
  const expression = MOODS[mood];
  const bodyClass = still ? "" : "kai-breathe";
  const hairClass = still ? "" : "kai-sway";
  const eyeClass = still ? "" : "kai-blink";
  // Wave on the friendly "hello" mood; subtle idle sway for everything else.
  const armClass = still
    ? ""
    : mood === "warm" || mood === "encouraging"
      ? "kai-wave"
      : "kai-arm-idle";

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
        {/* Skin — soft tanned, slightly sun-kissed. Warmer than the
            previous tan, with a peachy undertone that pairs better with
            freckles and reads as "real human in golden hour light". */}
        <linearGradient id="kai-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F1CDA8" />
          <stop offset="100%" stopColor="#D6A37C" />
        </linearGradient>
        {/* Hair — deep walnut with a touch of warm undertone at the tips. */}
        <linearGradient id="kai-hair" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2A1A12" />
          <stop offset="100%" stopColor="#3D2418" />
        </linearGradient>
        {/* Shirt — warm-gradient (brand) across the top half, violet at the
            bottom for the "colorful shirt" specified in the brief. */}
        <linearGradient id="kai-shirt" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FF3D83" />
          <stop offset="50%" stopColor="#FF6B3D" />
          <stop offset="100%" stopColor="#FFA53D" />
        </linearGradient>
        <linearGradient id="kai-shirt-accent" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#9D7FF0" />
          <stop offset="100%" stopColor="#6E48E4" />
        </linearGradient>
        {/* Highlight along the cheek/forehead for a 3D feel. */}
        <radialGradient id="kai-face-light" cx="0.36" cy="0.32" r="0.7">
          <stop offset="0%" stopColor="#FAE2C9" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#FAE2C9" stopOpacity="0" />
        </radialGradient>
        {/* Dot pattern for the shirt — gives the "colors" beat. */}
        <pattern
          id="kai-shirt-dots"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
        >
          <circle cx="2" cy="2" r="0.7" fill="#FDE7A8" opacity="0.55" />
          <circle cx="5" cy="5" r="0.6" fill="#F5EEE6" opacity="0.45" />
        </pattern>

        {/* Idle motion. Animation names are kai-* to avoid collisions
            with global keyframes. */}
        <style>{`
          @keyframes kai-breathe {
            0%, 100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(0.4px) scale(1.012); }
          }
          @keyframes kai-sway {
            0%, 100% { transform: rotate(0deg); }
            50%      { transform: rotate(0.8deg); }
          }
          @keyframes kai-blink {
            0%, 92%, 100% { transform: scaleY(1); }
            94%, 98%      { transform: scaleY(0.08); }
          }
          /* Wave — runs on mood='warm'. Three full back-and-forth swings
             with an upward bias so the hand stays in the "saying hi" zone. */
          @keyframes kai-wave {
            0%   { transform: rotate(0deg); }
            12%  { transform: rotate(-18deg); }
            24%  { transform: rotate(20deg); }
            36%  { transform: rotate(-15deg); }
            48%  { transform: rotate(18deg); }
            60%  { transform: rotate(-10deg); }
            72%  { transform: rotate(12deg); }
            100% { transform: rotate(0deg); }
          }
          /* Idle hand sway for non-warm moods — subtle, slower. */
          @keyframes kai-arm-idle {
            0%, 100% { transform: rotate(0deg); }
            50%      { transform: rotate(-2.5deg); }
          }
          .kai-breathe {
            transform-origin: 48px 64px;
            animation: kai-breathe 4.2s ease-in-out infinite;
          }
          .kai-sway {
            transform-origin: 48px 36px;
            animation: kai-sway 6.4s ease-in-out infinite;
          }
          .kai-blink {
            transform-origin: center;
            transform-box: fill-box;
            animation: kai-blink 6.8s ease-in-out infinite;
          }
          .kai-wave {
            transform-origin: 67px 72px;
            animation: kai-wave 2.4s ease-in-out 0.4s infinite;
          }
          .kai-arm-idle {
            transform-origin: 67px 72px;
            animation: kai-arm-idle 5.6s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .kai-breathe, .kai-sway, .kai-blink,
            .kai-wave, .kai-arm-idle { animation: none; }
          }
        `}</style>
      </defs>

      {/* Breathing wrapper — everything inside scales/translates softly. */}
      <g className={bodyClass}>
        <g transform={`rotate(${expression.tilt} 48 50)`}>
          {/* ───── Shirt — colorful crewneck (warm gradient + violet hem) ───── */}
          <path
            d="M14 92 C 14 78 22 70 32 68
               L 42 72 C 45 74 51 74 54 72
               L 64 68
               C 74 70 82 78 82 92 L 82 100 L 14 100 Z"
            fill="url(#kai-shirt)"
          />
          {/* Violet hem — bottom band of the shirt */}
          <path
            d="M 14 92 L 82 92 L 82 100 L 14 100 Z"
            fill="url(#kai-shirt-accent)"
            opacity="0.95"
          />
          {/* Dot pattern overlay — gives the "printed shirt" feel */}
          <path
            d="M14 92 C 14 78 22 70 32 68
               L 42 72 C 45 74 51 74 54 72
               L 64 68
               C 74 70 82 78 82 92 L 82 100 L 14 100 Z"
            fill="url(#kai-shirt-dots)"
          />
          {/* Crewneck collar curve */}
          <path
            d="M 36 71 Q 48 76 60 71"
            stroke="#9C2D5A"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />

          {/* Neck */}
          <path
            d="M42 60 L42 70 C 42 72 45 73 48 73 C 51 73 54 72 54 70 L 54 60 Z"
            fill="url(#kai-skin)"
          />
          {/* Neck shadow — gentle underline where the shirt meets the chin */}
          <path
            d="M 41 70 Q 48 73 55 70"
            stroke="#7A4F36"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.45"
          />

          {/* ───── Hair — voluminous curl cloud ─────
              Many overlapping rounded curls layered to suggest a frizzy
              dark curly halo around the face. Asymmetric on purpose. */}
          <g className={hairClass}>
            {/* Back / base shape — broad cloud silhouette */}
            <path
              d="M 18 50
                 C 14 38 16 24 28 16
                 C 38 8 56 8 66 14
                 C 78 20 82 32 80 46
                 C 80 50 78 54 76 56
                 L 74 54
                 C 74 50 72 46 70 44
                 C 70 30 64 24 58 22
                 C 60 28 60 32 58 36
                 C 56 30 50 28 48 28
                 C 46 28 44 30 42 32
                 C 40 30 38 26 38 22
                 C 32 24 28 30 28 40
                 C 26 44 24 50 22 54
                 L 20 54
                 C 18 54 16 52 18 50 Z"
              fill="url(#kai-hair)"
            />
            {/* Top curls — stacked round clumps */}
            <circle cx="28" cy="20" r="7" fill="url(#kai-hair)" />
            <circle cx="36" cy="14" r="6.5" fill="url(#kai-hair)" />
            <circle cx="44" cy="11" r="6.5" fill="url(#kai-hair)" />
            <circle cx="52" cy="11" r="6.5" fill="url(#kai-hair)" />
            <circle cx="60" cy="14" r="6.5" fill="url(#kai-hair)" />
            <circle cx="68" cy="20" r="6.5" fill="url(#kai-hair)" />
            {/* Side curls — wider at temples than at jaw */}
            <circle cx="22" cy="30" r="6" fill="url(#kai-hair)" />
            <circle cx="74" cy="32" r="6" fill="url(#kai-hair)" />
            <circle cx="20" cy="42" r="5.5" fill="url(#kai-hair)" />
            <circle cx="76" cy="44" r="5.5" fill="url(#kai-hair)" />
            <circle cx="22" cy="52" r="4.5" fill="url(#kai-hair)" />
            <circle cx="74" cy="54" r="4.5" fill="url(#kai-hair)" />
            {/* Stray curl tendrils — small, asymmetric, give the
                "lived-in" feeling instead of helmet hair */}
            <circle cx="14" cy="38" r="3" fill="url(#kai-hair)" opacity="0.85" />
            <circle cx="82" cy="40" r="3.2" fill="url(#kai-hair)" opacity="0.85" />
            <circle cx="33" cy="9" r="3.5" fill="url(#kai-hair)" opacity="0.9" />
            <circle cx="55" cy="8" r="3" fill="url(#kai-hair)" opacity="0.9" />
            <circle cx="65" cy="9" r="3.2" fill="url(#kai-hair)" opacity="0.9" />
            {/* Highlight curls — slightly lighter dots scattered for
                the dimensional "individual ringlets" effect */}
            <circle cx="30" cy="22" r="1.6" fill="#4D2F22" opacity="0.7" />
            <circle cx="40" cy="13" r="1.4" fill="#4D2F22" opacity="0.7" />
            <circle cx="56" cy="13" r="1.4" fill="#4D2F22" opacity="0.7" />
            <circle cx="66" cy="22" r="1.6" fill="#4D2F22" opacity="0.7" />
            <circle cx="22" cy="46" r="1.4" fill="#4D2F22" opacity="0.6" />
            <circle cx="74" cy="48" r="1.4" fill="#4D2F22" opacity="0.6" />
          </g>

          {/* Face — oval, drawn over hair so the forehead reads clearly */}
          <path
            d="M30 36 C 30 26 38 22 48 22 C 58 22 66 26 66 36 L 66 50
               C 66 60 58 66 48 66 C 38 66 30 60 30 50 Z"
            fill="url(#kai-skin)"
          />
          {/* Face highlight — soft warm light from upper left */}
          <path
            d="M30 36 C 30 26 38 22 48 22 C 58 22 66 26 66 36 L 66 50
               C 66 60 58 66 48 66 C 38 66 30 60 30 50 Z"
            fill="url(#kai-face-light)"
          />
          {/* Forehead curls — a couple of stray curls falling onto the
              forehead so the cloud doesn't feel like a wig. */}
          <circle cx="36" cy="26" r="2.8" fill="url(#kai-hair)" />
          <circle cx="42" cy="23" r="2.4" fill="url(#kai-hair)" />
          <circle cx="56" cy="24" r="2.6" fill="url(#kai-hair)" />
          <circle cx="61" cy="27" r="2.4" fill="url(#kai-hair)" />

          {/* ───── Earrings — dangling brass studs with bead drop ───── */}
          {/* Left */}
          <line
            x1="29"
            y1="50"
            x2="27.5"
            y2="56"
            stroke="#C68E3E"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <circle cx="29" cy="50" r="1.2" fill="#E8B95E" />
          <circle cx="27.5" cy="57" r="1.6" fill="#D9A23A" />
          <circle cx="27.2" cy="56.5" r="0.4" fill="#FDE7A8" />
          {/* Right */}
          <line
            x1="67"
            y1="50"
            x2="68.5"
            y2="56"
            stroke="#C68E3E"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <circle cx="67" cy="50" r="1.2" fill="#E8B95E" />
          <circle cx="68.5" cy="57" r="1.6" fill="#D9A23A" />
          <circle cx="68.2" cy="56.5" r="0.4" fill="#FDE7A8" />

          {/* Eyebrows — fuller and softer. Each brow is rendered as two
              overlapping strokes (a thicker base + a feathered top edge)
              so it reads as a tuft of hair rather than a single line. */}
          <path
            d={expression.browL}
            stroke="#2A1A12"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={expression.browL}
            stroke="#5A3826"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            transform="translate(0, -0.8)"
          />
          <path
            d={expression.browR}
            stroke="#2A1A12"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={expression.browR}
            stroke="#5A3826"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
            transform="translate(0, -0.8)"
          />

          {/* Eyes — almond shape with a soft warm undertone in the
              white, brown iris, dark pupil, and TWO highlights (one big
              upper-left catch + one smaller lower-right reflection) so
              the eye reads as "shiny" / lively instead of flat. */}
          <g>
            <g className={eyeClass}>
              <ellipse cx="40" cy={expression.eyeY} rx="3.4" ry="2.4" fill="#FBF5EE" />
            </g>
            <g className={eyeClass}>
              <ellipse cx="56" cy={expression.eyeY} rx="3.4" ry="2.4" fill="#FBF5EE" />
            </g>
            {/* iris — warm hazel-brown */}
            <circle cx="40" cy={expression.eyeY} r="1.95" fill="#5A3520" />
            <circle cx="56" cy={expression.eyeY} r="1.95" fill="#5A3520" />
            {/* inner iris glow */}
            <circle cx="40" cy={expression.eyeY} r="1.3" fill="#3A2014" />
            <circle cx="56" cy={expression.eyeY} r="1.3" fill="#3A2014" />
            {/* pupil */}
            <circle cx="40" cy={expression.eyeY} r="0.85" fill="#0F0824" />
            <circle cx="56" cy={expression.eyeY} r="0.85" fill="#0F0824" />
            {/* primary catch-light */}
            <circle cx="40.8" cy={expression.eyeY - 0.7} r="0.7" fill="#FFFFFF" />
            <circle cx="56.8" cy={expression.eyeY - 0.7} r="0.7" fill="#FFFFFF" />
            {/* secondary low-right glint */}
            <circle cx="39.2" cy={expression.eyeY + 0.7} r="0.3" fill="#FFFFFF" opacity="0.85" />
            <circle cx="55.2" cy={expression.eyeY + 0.7} r="0.3" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Upper lash hint */}
          <path
            d={`M36.8 ${expression.eyeY - 2.4} Q40 ${expression.eyeY - 3.2} 43.2 ${expression.eyeY - 2.4}`}
            stroke="#2A1A12"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M52.8 ${expression.eyeY - 2.4} Q56 ${expression.eyeY - 3.2} 59.2 ${expression.eyeY - 2.4}`}
            stroke="#2A1A12"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          {/* Lower lash hint — soft, just a whisper under each eye */}
          <path
            d={`M37.5 ${expression.eyeY + 2.1} Q40 ${expression.eyeY + 2.6} 42.5 ${expression.eyeY + 2.1}`}
            stroke="#3A2014"
            strokeWidth="0.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d={`M53.5 ${expression.eyeY + 2.1} Q56 ${expression.eyeY + 2.6} 58.5 ${expression.eyeY + 2.1}`}
            stroke="#3A2014"
            strokeWidth="0.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Freckles — soft, intentional, just enough to feel real. A
              gentle dusting across the nose bridge and apples of the
              cheeks. Nothing under the eyes, no asymmetric strays. */}
          <g fill="#8A5635">
            {/* Nose bridge — three points */}
            <circle cx="47" cy="46" r="0.5" opacity="0.6" />
            <circle cx="49" cy="48" r="0.5" opacity="0.65" />
            <circle cx="50" cy="45" r="0.4" opacity="0.55" />
            {/* Left cheek — three points */}
            <circle cx="38" cy="52" r="0.5" opacity="0.6" />
            <circle cx="40" cy="51" r="0.45" opacity="0.55" />
            <circle cx="40" cy="54" r="0.45" opacity="0.55" />
            {/* Right cheek — three points */}
            <circle cx="56" cy="51" r="0.45" opacity="0.55" />
            <circle cx="58" cy="52" r="0.5" opacity="0.6" />
            <circle cx="56" cy="54" r="0.45" opacity="0.55" />
          </g>

          {/* Nose hint — subtle line with a small gold nose ring on the
              left nostril (matches the reference photo). */}
          <path
            d="M48 44 Q49 50 47 53"
            stroke="#7A4F36"
            strokeWidth="0.7"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Nose ring — small gold hoop */}
          <circle
            cx="46.4"
            cy="53.4"
            r="1.1"
            fill="none"
            stroke="#E8B95E"
            strokeWidth="0.7"
          />
          <circle cx="45.6" cy="53" r="0.25" fill="#FDE7A8" />

          {/* Cheek warmth — natural rose */}
          <ellipse
            cx="35"
            cy={expression.eyeY + 10}
            rx="3"
            ry="1.8"
            fill="#C56548"
            opacity="0.35"
          />
          <ellipse
            cx="61"
            cy={expression.eyeY + 10}
            rx="3"
            ry="1.8"
            fill="#C56548"
            opacity="0.35"
          />

          {/* Lips — soft warm rose with a subtle highlight on the lower
              lip so the smile reads as gentle, not flat or pinched. */}
          <path
            d={expression.mouth}
            stroke="#8E3F37"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={expression.mouthFill ?? "none"}
          />
          {expression.mouthFill ? (
            <path
              d={expression.mouth}
              stroke="#F2A8B3"
              strokeWidth="0.6"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
              transform="translate(0, 0.6)"
            />
          ) : null}

          {/* ───── Shoulder sleeve cuff ─────
              Drawn BEFORE the rotating arm group and OUTSIDE it so it
              stays anchored to the shirt while the arm waves. The
              cuff overlaps the inner edge of the arm so the arm reads
              as emerging from inside the sleeve. */}
          <path
            d="M 56 64 Q 62 61 70 66 Q 72 73 70 78 Q 62 80 56 76 Z"
            fill="url(#kai-shirt)"
          />
          <path
            d="M 56 64 Q 62 61 70 66 Q 72 73 70 78 Q 62 80 56 76 Z"
            fill="url(#kai-shirt-dots)"
            opacity="0.85"
          />

          {/* ───── Right arm — one continuous tapered limb ─────
              A single filled cubic-bezier path that flows smoothly
              from the shoulder, up and out, around an organic elbow
              curve (no sharp hinge), and down into the wrist. The
              outer edge is one long S-curve; the inner edge mirrors
              it slightly closer to the body, creating the natural
              taper from shoulder (8 units wide) to wrist (5 units wide).
              The whole group pivots around the shoulder (66, 72)
              when the wave animation runs. */}
          <g className={armClass}>
            <path
              d="M 67 70
                 C 73 65 80 60 85 52
                 C 88 47 87 42 85 39
                 C 84 38 83 38 82 38
                 L 78 38
                 C 77 38 77 39 77 40
                 C 78 45 78 50 77 54
                 C 75 60 71 65 65 71
                 C 64 72 64 72 63 72
                 C 62 71 62 71 63 70
                 C 64 69 65 69 67 70 Z"
              fill="url(#kai-skin)"
            />
            {/* Inner-arm soft shading — a single curve along the
                concave (inner) side gives the limb dimensional weight
                without hard contours. */}
            <path
              d="M 65 70 C 72 66 78 60 83 53 C 84 48 83 44 81 41"
              stroke="#B68662"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />

            {/* ───── Hand — soft welcoming wave silhouette ─────
                Anchored at the wrist (80, 38) and rotated 14° outward
                so the palm tilts toward the viewer naturally rather
                than facing flat-on. Subtle finger bumps along the top
                edge, separate thumb on the inner (face-side) edge.
                No knuckles, no nails, no creases beyond a soft palm
                shadow. */}
            <g transform="translate(80 38) rotate(-14)">
              <path
                d="M -4.8 1.5
                   C -5.6 -1 -5.6 -4 -5.2 -7
                   C -5 -10 -4.4 -12 -3.4 -13
                   Q -2.4 -13.8 -1.6 -13
                   Q -1.2 -12 -1.1 -10.5
                   Q -0.6 -12.5 0 -13.5
                   Q 0.9 -14.3 1.8 -13.5
                   Q 2.3 -12.4 2.4 -10.8
                   Q 2.9 -12.4 3.6 -13
                   Q 4.5 -13.6 5.2 -12.6
                   Q 5.6 -11.4 5.5 -9.8
                   Q 5.9 -10.8 6.4 -11.2
                   Q 7.1 -11.6 7.4 -10.6
                   Q 7.6 -9.4 7.3 -7.8
                   C 7.6 -5.5 7.4 -2.5 6.6 0
                   C 6 1.4 4 2 0.5 2
                   C -2.5 2 -4.2 1.8 -4.8 1.5 Z"
                fill="url(#kai-skin)"
              />
              <path
                d="M -4.6 -1
                   C -6.6 -1 -7.6 0.8 -7 2.4
                   C -6.4 3.6 -4.6 3.6 -3.4 2.6
                   C -2.6 1.8 -2.8 0.4 -3.4 -0.4 Z"
                fill="url(#kai-skin)"
              />
              <path
                d="M -3.5 -1.5 Q 1 -0.5 5 -1.5"
                stroke="#B68662"
                strokeWidth="0.6"
                fill="none"
                strokeLinecap="round"
                opacity="0.32"
              />
            </g>
          </g>
        </g>
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
    // Slightly lifted brows — open expression, gentle arch
    browL: "M33 33.5 Q40 30.5 45 33.5",
    browR: "M51 33.5 Q56 30.5 63 33.5",
    // Soft closed smile with subtle upturn at the corners
    mouth: "M42 58 Q48 61 54 58",
  },
  warm: {
    tilt: -1,
    eyeY: 43,
    // Relaxed soft brows, neutral arch
    browL: "M33 34.5 Q40 32.5 45 34.5",
    browR: "M51 34.5 Q56 32.5 63 34.5",
    // Open friendly smile — the welcoming face
    mouth: "M40 57 Q48 63 56 57",
    mouthFill: "#D27567",
  },
  thinking: {
    tilt: -3,
    eyeY: 41,
    // One brow slightly higher than the other — the "thinking" tell
    browL: "M33 33.5 Q40 31.5 45 34.5",
    browR: "M51 34.5 Q56 31.5 63 33.5",
    // Soft pursed line, slight upturn
    mouth: "M43 59.5 Q48 60.5 53 59.5",
  },
  encouraging: {
    tilt: 1,
    eyeY: 41,
    // Brows lifted higher — bright expression
    browL: "M33 31.5 Q40 28.5 45 31.5",
    browR: "M51 31.5 Q56 28.5 63 31.5",
    // Broader smile, slightly wider
    mouth: "M40 57 Q48 64 56 57",
    mouthFill: "#D27567",
  },
  listening: {
    tilt: 0,
    eyeY: 42,
    // Calm, level brows — present and attentive
    browL: "M33 34.5 Q40 33.5 45 34.5",
    browR: "M51 34.5 Q56 33.5 63 34.5",
    // Subtle calm smile
    mouth: "M43 59 Q48 61 53 59",
  },
};
