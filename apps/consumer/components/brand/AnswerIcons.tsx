import type { SVGProps } from "react";

/**
 * AnswerIcons — small illustrated tiles for answer options.
 *
 * Same family as `StepIcons.tsx` (gradient tile + cream stroke icon +
 * cyan signature dot), sized down to 32×32 to sit cleanly inside the
 * 52px answer cards. The icon set is intentionally abstract +
 * playful — they add variety/fun across options without imposing
 * meaning on the answer text.
 *
 * Five icons total, mapped by option position (A → Spark, B → Drop,
 * C → Leaf, D → Heart, E → Bolt). Most questions only use 3, so the
 * first three get the most surface area.
 *
 * Use via `<AnswerIcon position={optionIdx} size={32} />` — the
 * wrapper picks the right glyph + the right brand color.
 */

interface IconTileProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const CREAM = "#F5EEE6";
const CYAN = "#5BD6E8";

// ---------- Shared chrome ----------

interface TileProps {
  size: number | string;
  gradId: string;
  gradStops: [string, string];
  /** Use a cream signature dot when bg is cyan (cyan-on-cyan won't read) */
  accentColor?: string;
  children: React.ReactNode;
  rest: SVGProps<SVGSVGElement>;
}

function Tile({
  size,
  gradId,
  gradStops,
  accentColor = CYAN,
  children,
  rest,
}: TileProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradStops[0]} />
          <stop offset="100%" stopColor={gradStops[1]} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
      {/* inner highlight */}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.18"
      />
      {children}
      {/* signature dot top-right */}
      <circle cx="26" cy="6" r="1.6" fill={accentColor} />
      <circle cx="26" cy="6" r="2.8" fill={accentColor} opacity="0.3" />
    </svg>
  );
}

// =====================================================================
// 1 · Spark — coral
// =====================================================================
export function AnswerSpark({ size = 32, ...rest }: IconTileProps) {
  return (
    <Tile
      size={size}
      gradId="ans-spark"
      gradStops={["#FF8252", "#FF6B47"]}
      rest={rest}
    >
      <path
        d="M16 8 L17.6 14.4 L24 16 L17.6 17.6 L16 24 L14.4 17.6 L8 16 L14.4 14.4 Z"
        fill={CREAM}
      />
    </Tile>
  );
}

// =====================================================================
// 2 · Drop — cyan
// =====================================================================
export function AnswerDrop({ size = 32, ...rest }: IconTileProps) {
  return (
    <Tile
      size={size}
      gradId="ans-drop"
      gradStops={["#7CE5F2", "#5BD6E8"]}
      accentColor={CREAM}
      rest={rest}
    >
      <path
        d="M16 7 C16 7 22 13 22 18 C22 21.3 19.3 24 16 24 C12.7 24 10 21.3 10 18 C10 13 16 7 16 7 Z"
        fill={CREAM}
      />
      {/* highlight on the droplet */}
      <ellipse cx="13.5" cy="17" rx="1.4" ry="2.2" fill="#FFFFFF" opacity="0.5" />
    </Tile>
  );
}

// =====================================================================
// 3 · Leaf — lavender
// =====================================================================
export function AnswerLeaf({ size = 32, ...rest }: IconTileProps) {
  return (
    <Tile
      size={size}
      gradId="ans-leaf"
      gradStops={["#E5DAF5", "#B8A5D9"]}
      rest={rest}
    >
      <path
        d="M9 23 C9 14 14 9 23 9 C23 18 18 23 9 23 Z"
        fill={CREAM}
        stroke="#1B0E3F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* leaf vein */}
      <path
        d="M9.5 22.5 L21 11"
        stroke="#1B0E3F"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Tile>
  );
}

// =====================================================================
// 4 · Heart — coral-glow
// =====================================================================
export function AnswerHeart({ size = 32, ...rest }: IconTileProps) {
  return (
    <Tile
      size={size}
      gradId="ans-heart"
      gradStops={["#FFA37A", "#FF8252"]}
      rest={rest}
    >
      <path
        d="M16 24 C16 24 7 18.5 7 13.5 C7 11 9 9 11.5 9 C13.2 9 14.7 9.8 16 11.2 C17.3 9.8 18.8 9 20.5 9 C23 9 25 11 25 13.5 C25 18.5 16 24 16 24 Z"
        fill={CREAM}
      />
    </Tile>
  );
}

// =====================================================================
// 5 · Bolt — plum (darker for contrast against light card)
// =====================================================================
export function AnswerBolt({ size = 32, ...rest }: IconTileProps) {
  return (
    <Tile
      size={size}
      gradId="ans-bolt"
      gradStops={["#5B3D8C", "#3D2270"]}
      rest={rest}
    >
      <path
        d="M18 7 L10 18 L15 18 L13 25 L22 13 L17 13 Z"
        fill={CREAM}
        strokeLinejoin="round"
      />
    </Tile>
  );
}

// =====================================================================
// Position-based picker
// =====================================================================
const ICON_BY_POSITION = [
  AnswerSpark,
  AnswerDrop,
  AnswerLeaf,
  AnswerHeart,
  AnswerBolt,
] as const;

interface AnswerIconProps {
  /** 0-indexed option position (A=0, B=1, ...) */
  position: number;
  size?: number | string;
}

export function AnswerIcon({ position, size = 32 }: AnswerIconProps) {
  const Icon = ICON_BY_POSITION[position % ICON_BY_POSITION.length]!;
  return <Icon size={size} />;
}
