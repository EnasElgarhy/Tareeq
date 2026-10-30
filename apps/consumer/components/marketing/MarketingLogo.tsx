import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/primitives/BrandMark";

export function MarketingLogo({ tone = "night" }: { tone?: "night" | "day" }) {
  return (
    <>
      <BrandMark tone={tone === "day" ? "flat" : "aurora"} height={24} />
      <span dir="ltr" lang="en" className={`font-heading whitespace-nowrap text-xl font-bold leading-none tracking-[-0.025em] ${tone === "day" ? "text-[#14101F]" : "text-sand"}`}>
        {BRAND.name}
      </span>
    </>
  );
}
