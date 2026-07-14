import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

type LogoVariant = "lockup" | "mark";
type LogoTone = "ink" | "cream";

interface LogoProps {
  /** Show the wordmark + mark together, or just the mark. */
  variant?: LogoVariant;
  /** Color treatment. Pick based on the surface behind the logo. */
  tone?: LogoTone;
  /** Rendered width in px or any valid CSS length. Height auto-scales. */
  width?: number;
  /** Wrap in a Link to "/" with an accessible label. */
  asLink?: boolean;
  className?: string;
  style?: CSSProperties;
}

const SRC = {
  "lockup-ink": "/logo/tareeq-logo.svg",
  "lockup-cream": "/logo/tareeq-logo-cream.svg",
  "mark-ink": "/logo/tareeq-mark.svg",
  "mark-cream": "/logo/tareeq-mark-cream.svg",
} as const;

// Aspect ratios match the source SVG viewBoxes:
//   lockup → viewBox="0 0 320 214"  → 214/320
//   mark   → viewBox="28 58 80 80"  → 1
const ASPECT = { lockup: 214 / 320, mark: 1 };

/**
 * Tareeq logo — always reference the SVG file. Never recreate the mark
 * in code, CSS, or a drawing library; the geometry is intentional.
 *
 * Decision rule:
 *   - Width < 120px or square frame?       → variant="mark"
 *   - Background plum / dark gradient?     → tone="cream"
 *   - Background cream / white / light?    → tone="ink" (default)
 *
 * See logo.md for the full guide.
 */
export function Logo({
  variant = "lockup",
  tone = "ink",
  width = 140,
  asLink = false,
  className,
  style,
}: LogoProps) {
  const src = SRC[`${variant}-${tone}`];
  const h = Math.round(width * ASPECT[variant]);

  const img = (
    <Image
      src={src}
      alt="Tareeq"
      width={width}
      height={h}
      priority
      className={className}
      style={style}
    />
  );

  return asLink ? (
    <Link href="/" aria-label="Tareeq home" className="inline-flex">
      {img}
    </Link>
  ) : (
    img
  );
}
