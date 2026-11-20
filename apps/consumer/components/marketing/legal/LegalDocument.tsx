import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Container } from "../Shared";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  type LegalBlock,
  type LegalSection,
  type LegalTable,
} from "./legalCopy";

interface LegalDocumentProps {
  sections: readonly LegalSection[];
  /** The other legal page, linked under the contents list. */
  other: { href: string; label: string };
}

const LINK_CLASS =
  "font-medium text-[#5A4A96] underline decoration-[#5A4A96]/35 underline-offset-[3px] transition-colors duration-150 hover:decoration-[#5A4A96] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]";

/** Turns each mention of the contact address into a mail link. */
function withMailLinks(text: string): ReactNode {
  const parts = text.split(LEGAL_CONTACT_EMAIL);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? (
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className={LINK_CLASS}>
          {LEGAL_CONTACT_EMAIL}
        </a>
      ) : null}
    </Fragment>
  ));
}

function ProviderTable({ table }: { table: LegalTable }) {
  return (
    <table className="w-full border-collapse text-start text-[15px] leading-relaxed">
      <thead className="max-sm:sr-only">
        <tr className="border-b border-[color:var(--day-line-strong)]">
          {table.head.map((heading) => (
            <th key={heading} scope="col" className="py-3 pe-5 text-start text-sm font-semibold text-[color:var(--day-ink)]">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr
            key={row[0]}
            className="border-b border-[color:var(--day-line)] align-top max-sm:block max-sm:py-4 max-sm:first:border-t"
          >
            {row.map((cell, index) =>
              index === 0 ? (
                <th
                  key={cell}
                  scope="row"
                  className="py-3.5 pe-5 text-start font-semibold text-[color:var(--day-ink)] max-sm:block max-sm:p-0"
                >
                  {cell}
                </th>
              ) : (
                <td key={cell} className="py-3.5 pe-5 text-[color:var(--day-ink-2)] max-sm:block max-sm:p-0 max-sm:pt-1.5">
                  {/* On a phone each row stacks, so the column name is repeated in front of the value. */}
                  <span aria-hidden="true" className="font-medium text-[color:var(--day-ink)] sm:hidden">
                    {table.head[index]}:{" "}
                  </span>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{withMailLinks(block)}</p>;
  if ("table" in block) return <ProviderTable table={block.table} />;
  return (
    <ul className="grid list-disc gap-2.5 ps-5 marker:text-[#B98A3A]">
      {block.items.map((item) =>
        typeof item === "string" ? (
          <li key={item}>{withMailLinks(item)}</li>
        ) : (
          <li key={item.label}>
            <strong className="font-semibold text-[color:var(--day-ink)]">{item.label}</strong>{" "}
            {withMailLinks(item.text)}
          </li>
        ),
      )}
    </ul>
  );
}

/**
 * A legal page laid out for reading: the contents stay beside the text on
 * wide screens and sit above it on a phone. The text is English, so the
 * document reads left to right in both site languages.
 */
export function LegalDocument({ sections, other }: LegalDocumentProps) {
  return (
    <Container className="pb-20 md:pb-28">
      <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <nav
          aria-label="On this page"
          className="self-start border-s-2 border-[color:var(--day-line-strong)] ps-5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto"
        >
          <p className="text-sm font-semibold text-[color:var(--day-ink)]">On this page</p>
          <ol className="mt-3 grid gap-2 text-[15px]">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[color:var(--day-ink-2)] underline-offset-[3px] transition-colors duration-150 hover:text-[#5A4A96] hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-[color:var(--day-line)] pt-4 text-[15px]">
            <Link href={other.href} className={LINK_CLASS}>
              {other.label}
            </Link>
          </p>
        </nav>

        <article className="max-w-[68ch]">
          <p className="text-sm text-[color:var(--day-ink-3)]">{LEGAL_LAST_UPDATED}</p>
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-28 border-t border-[color:var(--day-line)] pt-9 first-of-type:mt-6 [&:not(:first-of-type)]:mt-10"
            >
              <h2 id={`${section.id}-heading`} className="font-heading text-2xl font-semibold leading-snug sm:text-[1.7rem]">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 text-[17px] leading-[1.7] text-[color:var(--day-ink-2)]">
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </Container>
  );
}
