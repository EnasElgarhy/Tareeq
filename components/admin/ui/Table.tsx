import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

/** Dense, scannable data table — sand header, hairline rows, hover tint. */
export function Table({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-adm-md border border-adm-line bg-adm-card shadow-adm-xs">
      <table className={`w-full border-collapse text-left text-[13px] ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  className = "",
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-adm-line bg-adm-sand px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-adm-ink-muted ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Tr({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-adm-line last:border-b-0 transition-colors duration-adm-fast hover:bg-adm-violet/[0.04] ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({
  className = "",
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle text-adm-ink-soft ${className}`} {...rest}>
      {children}
    </td>
  );
}
