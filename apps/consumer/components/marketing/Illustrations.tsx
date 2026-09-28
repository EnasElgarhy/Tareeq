import type { ReactNode, SVGProps } from "react";

/**
 * Daybreak spot illustrations — same stroke language as WayIcons
 * (rounded currentColor strokes, gold + horizon accents), so each piece
 * sits naturally on either the night or the day side of the site.
 */

const GOLD = "#F4C660";
const HORIZON = "#F4A97C";
const DAWN = "#C8B6F0";

interface IllustrationProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

interface FrameProps extends IllustrationProps {
  viewBox: string;
  label: string;
  children: ReactNode;
}

const Frame = ({ viewBox, className = "", label, children }: FrameProps) => (
  <svg
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    className={className}
  >
    {children}
  </svg>
);

/** Winding dotted path climbing to a rising sun — the site’s signature image. */
export const PathToDawn = ({ className = "" }: IllustrationProps) => (
  <Frame
    viewBox="0 0 320 240"
    label="A winding path leading to a sunrise"
    className={className}
  >
    {/* sun */}
    <circle cx="248" cy="66" r="26" stroke={GOLD} fill="none" />
    <path
      stroke={GOLD}
      d="M248 24v-8M278 36l6-6M290 66h8M218 36l-6-6M282 92l7 4M214 92l-7 4"
    />
    {/* horizon dunes */}
    <path d="M12 168c44-18 84-18 128 0s84 18 168 0" opacity="0.5" />
    <path d="M12 196c56-14 100-14 148 0s104 12 148-4" opacity="0.3" />
    {/* the path */}
    <path
      d="M28 226c52 0 46-40 88-48s34-30 62-42 40-26 56-44"
      strokeDasharray="0.1 7"
      strokeWidth="2.5"
    />
    {/* waypoints */}
    <circle cx="116" cy="178" r="4.5" />
    <circle cx="178" cy="136" r="4.5" />
    <circle cx="234" cy="92" r="5" fill={GOLD} stroke="none" />
    {/* start marker */}
    <circle cx="28" cy="226" r="6" />
    <circle cx="28" cy="226" r="1.8" fill="currentColor" stroke="none" />
    {/* eight-point sparks */}
    <path stroke={DAWN} d="M64 60v10M59 65h10M300 130v8M296 134h8" />
  </Frame>
);

/** Eight-point compass rose with a gold needle. */
export const CompassRose = ({ className = "" }: IllustrationProps) => (
  <Frame viewBox="0 0 200 200" label="Compass rose" className={className}>
    <circle cx="100" cy="100" r="78" />
    <circle cx="100" cy="100" r="64" opacity="0.35" />
    <path d="M100 14v18M100 168v18M14 100h18M168 100h18" />
    <path
      opacity="0.45"
      d="m39 39 13 13M148 148l13 13M161 39l-13 13M52 148l-13 13"
    />
    <path fill={GOLD} stroke="none" d="M100 48 112 100l-12 12-12-12z" />
    <path
      fill="currentColor"
      stroke="none"
      opacity="0.35"
      d="M100 152 88 100l12-12 12 12z"
    />
    <circle cx="100" cy="100" r="7" fill="currentColor" stroke="none" />
    <circle cx="100" cy="100" r="2.6" fill={GOLD} stroke="none" />
    <text
      x="100"
      y="34"
      textAnchor="middle"
      fontSize="12"
      fill="currentColor"
      stroke="none"
      fontFamily="inherit"
      opacity="0.7"
    >
      N
    </text>
  </Frame>
);

/** Half-risen sun over layered dunes. */
export const SunriseDunes = ({ className = "" }: IllustrationProps) => (
  <Frame viewBox="0 0 320 180" label="Sunrise over dunes" className={className}>
    <clipPath id="sd-sky">
      <rect x="0" y="0" width="320" height="118" />
    </clipPath>
    <g clipPath="url(#sd-sky)">
      <circle
        cx="160"
        cy="118"
        r="34"
        fill={GOLD}
        stroke="none"
        opacity="0.9"
      />
      <circle cx="160" cy="118" r="52" stroke={HORIZON} opacity="0.6" />
      <circle cx="160" cy="118" r="72" stroke={DAWN} opacity="0.35" />
    </g>
    <path d="M0 118h320" opacity="0.5" />
    <path d="M0 140c56-16 108-16 160 0s104 16 160 0" opacity="0.55" />
    <path d="M0 162c64-12 128-12 192 2s96 8 128-4" opacity="0.3" />
    <path stroke={GOLD} d="M52 52v10M47 57h10M270 40v8M266 44h8" />
  </Frame>
);

/** Stars joined into a route — the night version of the path. */
export const Constellation = ({ className = "" }: IllustrationProps) => (
  <Frame
    viewBox="0 0 320 200"
    label="Constellation forming a path"
    className={className}
  >
    <path
      d="m36 164 62-28 44-48 58-14 66-40"
      strokeDasharray="0.1 6"
      opacity="0.8"
    />
    {[
      [36, 164],
      [98, 136],
      [142, 88],
      [200, 74],
    ].map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <circle cx={x} cy={y} r="3" fill="currentColor" stroke="none" />
        <circle cx={x} cy={y} r="7.5" opacity="0.4" />
      </g>
    ))}
    {/* destination star — eight-point, gold */}
    <path
      fill={GOLD}
      stroke="none"
      d="m266 34 3.4 8.4 8.4 3.4-8.4 3.4-3.4 8.4-3.4-8.4-8.4-3.4 8.4-3.4z"
    />
    <path
      opacity="0.35"
      d="M60 60v8M56 64h8M250 150v8M246 154h8M120 30v6M117 33h6"
    />
  </Frame>
);

/** MENA arch window with a dawn horizon inside. */
export const ArchHorizon = ({ className = "" }: IllustrationProps) => (
  <Frame
    viewBox="0 0 200 240"
    label="Arched window opening onto a sunrise"
    className={className}
  >
    <path d="M32 224V96c0-46 30-72 68-72s68 26 68 72v128" />
    <path d="M20 224h160" />
    <path d="M48 224V100c0-36 23-56 52-56s52 20 52 56v124" opacity="0.4" />
    <g>
      <circle
        cx="100"
        cy="150"
        r="20"
        fill={GOLD}
        stroke="none"
        opacity="0.9"
      />
      <path d="M56 150h26M118 150h26" stroke={HORIZON} />
      <path d="M60 172c26-10 54-10 80 0" opacity="0.5" />
      <path d="M64 194c24-8 48-8 72 0" opacity="0.3" />
    </g>
    <path stroke={DAWN} d="M100 74v10M95 79h10" />
  </Frame>
);
