export function SuggestionChip({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="shrink-0 rounded-full border border-[color:var(--day-line-strong)] bg-[color:var(--day-card)] px-3.5 py-2 text-[12px] font-bold text-[#57458D] shadow-[0_4px_10px_rgba(42,33,24,0.04)] transition hover:border-[#F2C94C] hover:bg-[#FFF8DC] active:scale-95"
    >
      {label}
    </button>
  );
}
