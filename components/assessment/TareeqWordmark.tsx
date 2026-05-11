import Link from "next/link";

type TareeqWordmarkProps = {
  className?: string;
};

export function TareeqWordmark({ className = "" }: TareeqWordmarkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline gap-0.5 text-[1.65rem] font-medium leading-none tracking-normal text-text-100 ${className}`}
      aria-label="tareeq home"
    >
      taree
      <span className="relative inline-block text-logo-cyan">
        q
        <span
          className="absolute -end-1 top-1 size-2 rounded-full border border-logo-cyan/80"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
