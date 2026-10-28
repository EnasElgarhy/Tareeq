/** Width-to-height ratio of the cropped mark files in /public/logo. */
const MARK_ASPECT = 242 / 154;

interface BrandMarkProps {
  /** "aurora" on night surfaces (the website's gradient), "flat" on cream. */
  tone?: "aurora" | "flat";
  /** Rendered height in px; the width follows the mark's proportions. */
  height?: number;
  className?: string;
}

/**
 * The Map My CORE mark, "First Light": a path climbing a hill toward the
 * rising sun. It always sits beside the wordmark, so it is decorative here
 * (the link or heading around it carries the name). The same mark is used
 * in English and Arabic. Source files and the full kit: output/logo-final.
 */
export function BrandMark({ tone = "aurora", height = 22, className }: BrandMarkProps) {
  const src = tone === "aurora" ? "/logo/mmc-mark-aurora.svg" : "/logo/mmc-mark.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={Math.round(height * MARK_ASPECT)}
      height={height}
      className={`inline-block shrink-0 ${className ?? ""}`}
    />
  );
}
