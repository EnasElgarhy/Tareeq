"use client";

/** Kai's portrait on the lavender tile, cropped to head and shoulders. */
export function KaiPortrait({ size = "lg" }: { size?: "lg" | "sm" }) {
  const box = size === "lg" ? "h-[104px] w-[88px] rounded-[24px]" : "h-[60px] w-[52px] rounded-[16px]";
  const img = size === "lg" ? "mt-[-8px] w-[200px]" : "mt-[-5px] w-[118px]";
  return (
    <div className={`flex shrink-0 justify-center overflow-hidden bg-[#e3dcf5] ${box}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kai/kai-rest-v2.webp"
        alt=""
        width={200}
        height={200}
        className={`h-auto max-w-none ${img}`}
      />
    </div>
  );
}
