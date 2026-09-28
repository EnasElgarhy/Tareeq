export function MarketingLogo() {
  return (
    <>
      <span
        aria-hidden="true"
        className="inline-block size-8 shrink-0 bg-aurora"
        style={{
          WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
          maskImage: "url('/logo/tareeq-mark.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <span className="text-xl font-bold leading-none tracking-[-0.025em] text-sand">
        tareeq
      </span>
    </>
  );
}
