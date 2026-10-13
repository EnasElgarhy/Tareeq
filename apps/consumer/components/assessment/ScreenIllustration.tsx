import Image from "next/image";

export interface ScreenIllustrationAsset {
  /** Art for left-to-right layouts; Kai should face the content side. */
  src: string;
  /** Mirrored copy for Arabic, so Kai still faces the content. */
  srcRtl?: string;
  width: number;
  height: number;
  /** Horizontal focus inside the panel (CSS object-position x), LTR. */
  focusX?: string;
}

/**
 * Per-screen side art, kept separate from the shared assessment background:
 * each route maps to its own asset here, so screens can use different
 * images without touching the night surface. Desktop only (lg+) — the art
 * fills the inline-start half of the screen (plus 40px, so its fade ends
 * where the content column begins at every width) and fades into the
 * background toward the content. Height-driven cover keeps the focus point
 * (focusX) in frame from 1024px up through ultrawide and tall tablets.
 */
export const SCREEN_ILLUSTRATIONS: Readonly<
  Record<string, ScreenIllustrationAsset>
> = {
  "/register": {
    src: "/assessment/kai-path-night.webp",
    srcRtl: "/assessment/kai-path-night-rtl.webp",
    width: 1536,
    height: 1024,
    focusX: "28%",
  },
};

interface ScreenIllustrationProps {
  pathname: string;
  isRtl: boolean;
}

export function ScreenIllustration({
  pathname,
  isRtl,
}: ScreenIllustrationProps) {
  const asset = SCREEN_ILLUSTRATIONS[pathname];
  if (!asset) return null;

  const src = isRtl && asset.srcRtl ? asset.srcRtl : asset.src;
  const focusX = asset.focusX ?? "50%";
  const objectPosition = isRtl
    ? `calc(100% - ${focusX}) center`
    : `${focusX} center`;

  return (
    <div
      aria-hidden="true"
      className="screen-illustration pointer-events-none absolute inset-y-0 start-0 z-0 hidden w-[calc(50%+40px)] lg:block"
    >
      <Image
        src={src}
        alt=""
        width={asset.width}
        height={asset.height}
        priority
        sizes="(min-width: 1024px) 50vw, 0px"
        className="size-full object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}
