export function SuggestionChip({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="shrink-0 rounded-full border border-violet/25 bg-violet/[0.06] px-3.5 py-2 text-[12px] font-bold text-violet transition hover:bg-violet/[0.12] active:scale-95"
    >
      {label}
    </button>
  );
}
