export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1" role="separator">
      <span className="h-px flex-1 bg-carbon/8" />
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-carbon/35">{label}</span>
      <span className="h-px flex-1 bg-carbon/8" />
    </div>
  );
}
