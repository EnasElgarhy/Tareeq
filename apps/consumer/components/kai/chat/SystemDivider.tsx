export function SystemDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1" role="separator">
      <span className="rounded-full bg-[color:var(--day-inset,#efe7da)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
        {label}
      </span>
    </div>
  );
}
