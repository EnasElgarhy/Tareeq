"use client";

import { useState } from "react";
import type { CustomQuestion, CustomOption } from "@/lib/admin/custom-content";
import type { AssessmentCategory } from "@/lib/admin/custom-content";

interface Props {
  questions: CustomQuestion[];
  categories: AssessmentCategory[];
  supportedLanguages: string[];
  assessmentName: string;
}

const OPTION_PALETTE = [
  "#F4C660", // gold
  "#9D7FF0", // violet-soft
  "#F2A8B3", // blush
  "#6FE0C0", // mint
  "#C8B6F0", // lilac
];

function localized(value: Record<string, string>, locale: string): string {
  return value[locale] ?? value["en"] ?? value["ar"] ?? "";
}

export function AssessmentPreviewClient({
  questions,
  categories,
  supportedLanguages,
  assessmentName,
}: Props) {
  const [index, setIndex] = useState(0);
  const [locale, setLocale] = useState(supportedLanguages[0] ?? "en");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdminMeta, setShowAdminMeta] = useState(true);

  const question = questions[index];
  const total = questions.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.code, localized(c.name, locale)]),
  );

  function goNext() {
    setIndex((i) => Math.min(i + 1, total - 1));
    setSelected(null);
  }

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0));
    setSelected(null);
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-adm-ink-muted text-[13px]">
        No questions added yet. Add questions in the Questions tab first.
      </div>
    );
  }

  const isText = question.kind === "text";
  const isSelect = question.kind === "select";

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Toolbar */}
      <div className="flex w-full max-w-[420px] items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-full border border-adm-line bg-adm-card px-1 py-1">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                locale === lang
                  ? "bg-adm-violet text-white"
                  : "text-adm-ink-muted hover:text-adm-ink"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <span className="text-[12px] text-adm-ink-muted tabular-nums">
          {index + 1} / {total}
        </span>

        <button
          type="button"
          onClick={() => setShowAdminMeta((v) => !v)}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
            showAdminMeta
              ? "border-adm-violet/40 bg-adm-violet/10 text-adm-violet"
              : "border-adm-line text-adm-ink-muted hover:text-adm-ink"
          }`}
        >
          {showAdminMeta ? "Hide scoring" : "Show scoring"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[420px]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-adm-line">
          <div
            className="h-full rounded-full bg-adm-violet transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Phone frame */}
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[2rem] p-6 shadow-adm-lg"
        style={{
          background:
            "linear-gradient(180deg, #221248 0%, #100a24 38%, #08051a 100%)",
          minHeight: 520,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Admin badge */}
        <div
          className="self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(110,72,228,0.25)", color: "#9d7ff0" }}
        >
          Admin preview · {assessmentName}
        </div>

        {/* Question bubble */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(245,238,230,0.1)",
          }}
        >
          <p
            className="m-0 italic"
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={{
              fontFamily: '"Noto Serif", "Georgia", ui-serif, serif',
              fontSize: "clamp(15px, 1rem + 0.5vw, 19px)",
              lineHeight: 1.3,
              color: "#f5eee6",
            }}
          >
            {localized(question.title, locale) || (
              <span style={{ color: "rgba(245,238,230,0.35)" }}>
                [no {locale} translation]
              </span>
            )}
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(245,238,230,0.35)" }}
          >
            Q{index + 1} · {question.kind}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-1 flex-col gap-2">
          {isText ? (
            <TextPreview locale={locale} />
          ) : isSelect ? (
            <SelectPreview locale={locale} />
          ) : (
            question.options.map((option, i) => (
              <OptionCard
                key={option.id}
                option={option}
                index={i}
                locale={locale}
                isSelected={selected === option.letter}
                categoryName={
                  option.categoryCode
                    ? (categoryMap[option.categoryCode] ?? option.categoryCode)
                    : null
                }
                showAdminMeta={showAdminMeta}
                onSelect={() =>
                  setSelected((prev) =>
                    prev === option.letter ? null : option.letter,
                  )
                }
              />
            ))
          )}
        </div>

        {/* Tap hint */}
        <p
          className="text-center text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(245,238,230,0.3)" }}
        >
          Preview only · no answers saved
        </p>
      </div>

      {/* Navigation */}
      <div className="flex w-full max-w-[420px] items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-1.5 rounded-adm-md border border-adm-line px-4 py-2 text-[13px] font-semibold text-adm-ink-muted transition hover:border-adm-violet hover:text-adm-violet disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          className="flex items-center gap-1.5 rounded-adm-md border border-adm-line px-4 py-2 text-[13px] font-semibold text-adm-ink-muted transition hover:border-adm-violet hover:text-adm-violet disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      {/* Jump to question */}
      <div className="flex w-full max-w-[420px] flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setSelected(null);
            }}
            className={`size-7 rounded-full text-[11px] font-semibold transition ${
              i === index
                ? "bg-adm-violet text-white"
                : "border border-adm-line text-adm-ink-muted hover:border-adm-violet hover:text-adm-violet"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionCard({
  option,
  index,
  locale,
  isSelected,
  categoryName,
  showAdminMeta,
  onSelect,
}: {
  option: CustomOption;
  index: number;
  locale: string;
  isSelected: boolean;
  categoryName: string | null;
  showAdminMeta: boolean;
  onSelect: () => void;
}) {
  const accent = OPTION_PALETTE[index % OPTION_PALETTE.length] ?? "#F4C660";
  const text = localized(option.text, locale);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition active:scale-[0.99]"
      style={{
        background: isSelected
          ? "linear-gradient(95deg, #ff3d83 0%, #ff6b3d 55%, #ffa53d 100%)"
          : "rgba(255,255,255,0.07)",
        border: isSelected ? "none" : `1px solid ${accent}33`,
        boxShadow: isSelected
          ? `0 8px 24px rgba(244,198,96,0.22)`
          : `inset 0 0 0 1px rgba(245,238,230,0.10)`,
        minHeight: 44,
      }}
    >
      {/* Letter badge */}
      <span
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
        style={{
          background: isSelected ? "rgba(20,16,31,0.15)" : `${accent}1f`,
          color: isSelected ? "rgba(20,16,31,0.8)" : "#f5eee6",
        }}
      >
        {option.letter}
      </span>

      {/* Option text + admin meta */}
      <span className="flex flex-1 flex-col gap-0.5">
        <span
          className="text-[13.5px] leading-snug"
          dir={locale === "ar" ? "rtl" : "ltr"}
          style={{ color: isSelected ? "rgba(20,16,31,0.9)" : "#f5eee6" }}
        >
          {text || (
            <span style={{ color: "rgba(245,238,230,0.35)" }}>
              [no {locale} translation]
            </span>
          )}
        </span>

        {showAdminMeta && (categoryName || option.points !== 0) ? (
          <span className="flex items-center gap-1.5">
            {categoryName ? (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: `${accent}22`,
                  color: accent,
                }}
              >
                {categoryName}
              </span>
            ) : null}
            <span
              className="text-[9px] font-semibold"
              style={{ color: "rgba(245,238,230,0.45)" }}
            >
              {option.points} pt{option.points !== 1 ? "s" : ""}
            </span>
          </span>
        ) : null}
      </span>

      {/* Arrow */}
      <span
        className="mt-1 shrink-0 text-[11px] transition-opacity"
        style={{
          color: isSelected ? "rgba(20,16,31,0.6)" : "rgba(245,238,230,0.3)",
        }}
      >
        →
      </span>
    </button>
  );
}

function TextPreview({ locale }: { locale: string }) {
  return (
    <textarea
      placeholder={`Write your response… (${locale.toUpperCase()})`}
      rows={5}
      className="w-full resize-none rounded-xl px-4 py-3 text-[14px] leading-relaxed"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(245,238,230,0.1)",
        color: "#f5eee6",
        outline: "none",
      }}
      dir={locale === "ar" ? "rtl" : "ltr"}
    />
  );
}

function SelectPreview({ locale }: { locale: string }) {
  return (
    <div
      className="flex h-14 w-full items-center rounded-full px-5 text-[14px] font-semibold"
      dir={locale === "ar" ? "rtl" : "ltr"}
      style={{
        background: "#f5eee6",
        color: "#14101f",
      }}
    >
      {locale === "ar" ? "اختر إجابة…" : "Select an option…"}
    </div>
  );
}
