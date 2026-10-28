import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/primitives/BrandMark";

export function MarketingLogo() {
  return (
    <>
      <BrandMark tone="aurora" height={24} />
      <span dir="ltr" lang="en" className="font-heading whitespace-nowrap text-xl font-bold leading-none tracking-[-0.025em] text-sand">
        {BRAND.name}
      </span>
    </>
  );
}
