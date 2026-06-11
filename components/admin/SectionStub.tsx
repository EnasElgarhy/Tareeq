export function SectionStub({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[24px] font-bold text-slate-900">{title}</h1>
      </header>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#6E48E4]">
          {phase} · coming soon
        </p>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
