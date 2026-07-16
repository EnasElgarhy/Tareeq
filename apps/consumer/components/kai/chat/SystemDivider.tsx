export function SystemDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1" role="separator">
      <span className="rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-3 py-1 text-[10px] font-bold uppercase text-[color:var(--day-ink-3,#675d4e)]">
        {label}
      </span>
    </div>
  );
}
