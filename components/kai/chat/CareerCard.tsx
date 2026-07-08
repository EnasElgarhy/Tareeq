import { GrowthIcon } from "@/components/brand/DomainIcons";

export function CareerCard({
  title,
  description,
  onOpen,
}: {
  title: string;
  description: string;
  onOpen?: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className={`justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px] ${onOpen ? "cursor-pointer transition hover:border-[color:var(--day-line-strong,rgba(43,36,28,0.2))]" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(255,107,61,0.14), rgba(255,165,61,0.06))" }}
        >
          <GrowthIcon size={18} />
        </span>
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      {description ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{description}</p>
      ) : null}
    </div>
  );
}
