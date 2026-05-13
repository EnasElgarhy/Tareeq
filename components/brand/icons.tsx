import type { SVGProps } from "react";

/**
 * Tareeq icon system — owned, branded, consistent.
 *
 * Every icon shares:
 *   • 24×24 viewBox, scaled via `size` prop
 *   • currentColor stroke, 1.75 stroke-width, round line joins
 *   • A single cyan signature dot at a natural termination point —
 *     the same brand cue that lives on the wordmark's `q`
 *
 * Use these instead of lucide-react wherever brand identity matters.
 * (Lucide stays fine for utility moments — chevrons in dropdowns, etc.)
 */

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  /** Override the cyan signature dot — pass `false` to hide it. */
  showAccent?: boolean;
};

const STROKE = 1.75;
const ACCENT = "#5BD6E8";

function Svg({
  size = 20,
  showAccent,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  // showAccent is consumed by each icon function before forwarding props here.
  // Strip it from DOM attrs.
  void showAccent;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      {children}
    </svg>
  );
}

function Accent({ cx, cy, r = 1.4 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={ACCENT} stroke="none" />;
}

export function TareeqCompass({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 5.5 L14 12 L12 18.5 L10 12 Z" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      {showAccent ? <Accent cx={12} cy={5.5} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqSparkle({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <path d="M12 3.5 L13.4 9.6 L19.5 11 L13.4 12.4 L12 18.5 L10.6 12.4 L4.5 11 L10.6 9.6 Z" />
      <path d="M18.5 17 L19.5 19 M19 18 L21 18" strokeWidth="1.5" />
      {showAccent ? <Accent cx={19.5} cy={5.5} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqUsers({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <circle cx="9" cy="9" r="3.5" />
      <circle cx="16.5" cy="11" r="2.6" />
      <path d="M3 20 c1.5-3.6 4-5 6-5 s4.5 1.4 6 5" />
      <path d="M14.5 19 c0.8-2.2 2.5-3 4-3 s2 0.6 2.5 2" />
      {showAccent ? <Accent cx={20} cy={5.5} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqArrowRight({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg strokeWidth={2} {...rest}>
      <path d="M4.5 12 H19" />
      <path d="M13 6 L19 12 L13 18" />
      {showAccent ? <Accent cx={19} cy={12} r={1.5} /> : null}
    </Svg>
  );
}

export function TareeqArrowLeft({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg strokeWidth={2} {...rest}>
      <path d="M19.5 12 H5" />
      <path d="M11 6 L5 12 L11 18" />
      {showAccent ? <Accent cx={5} cy={12} r={1.5} /> : null}
    </Svg>
  );
}

export function TareeqLock({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <rect x="4.5" y="11" width="15" height="9.5" rx="2.5" />
      <path d="M8 11 V7.5 a4 4 0 0 1 8 0 V11" />
      {showAccent ? <Accent cx={12} cy={15.8} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqRotate({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <path d="M3 12 a9 9 0 0 1 15.5-6.2" />
      <path d="M19 2.5 V7 H14.5" />
      {showAccent ? <Accent cx={19} cy={7} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqPlay({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <path
        d="M7 5.5 L18.5 12 L7 18.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      {showAccent ? <Accent cx={18.5} cy={12} r={1.5} /> : null}
    </Svg>
  );
}

export function TareeqPause({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <rect
        x="6.5"
        y="5"
        width="3.5"
        height="14"
        rx="1.4"
        fill="currentColor"
        stroke="none"
      />
      <rect
        x="14"
        y="5"
        width="3.5"
        height="14"
        rx="1.4"
        fill="currentColor"
        stroke="none"
      />
      {showAccent ? <Accent cx={20.2} cy={5.6} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqVolumeOn({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <path
        d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M15 9.5 a3.8 3.8 0 0 1 0 5" />
      <path d="M17.5 7 a7 7 0 0 1 0 10" />
      {showAccent ? <Accent cx={20.5} cy={12} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqVolumeOff({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <path
        d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M15.5 9.5 L20.5 14.5" />
      <path d="M20.5 9.5 L15.5 14.5" />
      {showAccent ? <Accent cx={20.5} cy={12} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqMic({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg {...rest}>
      <rect x="9" y="3" width="6" height="11.5" rx="3" />
      <path d="M5.5 11 a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18 V21" />
      <path d="M9 21 H15" />
      {showAccent ? <Accent cx={19} cy={5.5} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqChevronDown({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg strokeWidth={2} {...rest}>
      <path d="M6 9.5 L12 15.5 L18 9.5" />
      {showAccent ? <Accent cx={18} cy={9.5} r={1.2} /> : null}
    </Svg>
  );
}

export function TareeqCheck({ showAccent = true, ...rest }: IconProps) {
  return (
    <Svg strokeWidth={2} {...rest}>
      <path d="M5 12.5 L10 17.5 L19 6.5" />
      {showAccent ? <Accent cx={19} cy={6.5} r={1.2} /> : null}
    </Svg>
  );
}
