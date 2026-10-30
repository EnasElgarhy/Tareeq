"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { coreWording } from "@/lib/core-v2/content/core-content";
import type { Locale } from "@/lib/i18n/locale";
import { EXAMPLE } from "./story-data";

type Side = "start" | "end";

interface Piece {
  side: Side;
  /** Tailwind position classes, relative to the phone. */
  at: string;
  node: ReactNode;
}

/** "C · Curiosities: what sparks…" → "Curiosities"; the Arabic key has no letter prefix. */
function letterName(locale: Locale, letter: string): string {
  const text = coreWording(locale, `S1-KEY-${letter}`) ?? "";
  return text.replace(/^[A-Z]\s*·\s*/, "").split(":")[0].trim();
}

const card = "rounded-2xl border border-[#14101F]/8 bg-[#FFFCF6] text-[#14101F] shadow-[0_18px_40px_-16px_rgba(8,5,26,0.55)]";
const darkCard = "rounded-2xl border border-white/10 bg-[#221248] text-[#F5EEE6] shadow-[0_18px_40px_-16px_rgba(8,5,26,0.7)]";
const LETTER_TONES: Record<string, string> = {
  C: "bg-[#6D5BA8] text-white",
  O: "bg-[#F4C660] text-[#14101F]",
  R: "bg-[#F2A8B3] text-[#14101F]",
  E: "bg-[#C8B6F0] text-[#14101F]",
};

function piecesFor(step: number, locale: Locale, you: string): Piece[] {
  const w = (id: string) => coreWording(locale, id) ?? "";
  if (step === 0) {
    const letters: [string, Side, string][] = [
      ["C", "start", "top-[6%] -start-[34%] lg:-start-[46%]"],
      ["O", "end", "top-[16%] -end-[34%] lg:-end-[48%]"],
      ["R", "start", "top-[52%] -start-[30%] lg:-start-[44%]"],
      ["E", "end", "top-[62%] -end-[30%] lg:-end-[42%]"],
    ];
    return [
      ...letters.map(([letter, side, at]) => ({
        side,
        at,
        node: (
          <div className={`${card} flex items-center gap-2 px-2.5 py-2`}>
            {/* No Latin letters beside Arabic text: a colour chip stands in for the letter. */}
            <span className={`grid size-7 place-items-center rounded-lg text-[13px] font-extrabold ${LETTER_TONES[letter]}`}>
              {locale === "ar" ? null : letter}
            </span>
            <span className="whitespace-nowrap pe-1 text-[12.5px] font-bold">{letterName(locale, letter)}</span>
          </div>
        ),
      })),
      {
        side: "end",
        at: "bottom-[4%] -end-[18%] lg:-end-[30%]",
        node: (
          <div className={`${card} w-[150px] px-3 pb-2.5 pt-3`}>
            <div className="relative h-[3px] rounded-full bg-[#14101F]/15">
              {[0, 50, 100].map((p) => (
                <span key={p} className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full border-2 border-[#14101F]/25 bg-[#FFFCF6]" style={{ insetInlineStart: `calc(${p}% - 4px)` }} />
              ))}
              <motion.span
                className="absolute -top-6 -translate-x-1/2 rounded-md bg-[#F4C660] px-1.5 py-0.5 text-[10.5px] font-bold rtl:translate-x-1/2"
                initial={{ insetInlineStart: "0%" }}
                animate={{ insetInlineStart: "50%" }}
                transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.5 }}
              >
                {you}
              </motion.span>
            </div>
          </div>
        ),
      },
    ];
  }
  if (step === 1) {
    return [
      {
        side: "end",
        at: "top-[8%] -end-[26%] lg:-end-[40%]",
        node: (
          <div className={`${darkCard} flex items-center gap-2 px-3 py-2`}>
            <span className="size-2 rounded-full bg-[#F4C660]" />
            <span className="whitespace-nowrap text-[12.5px] font-bold">{w("CUR-RD-NAME")}</span>
          </div>
        ),
      },
      {
        side: "start",
        at: "top-[36%] -start-[34%] lg:-start-[50%]",
        node: (
          <div className={`${card} max-w-[190px] px-3 py-2.5`}>
            <span className="block text-[10.5px] font-semibold text-[#5C5142]">{w("S3-NOTICE-LABEL")}</span>
            <span className="mt-1 block rounded-lg bg-[#FBEFD0] px-2 py-1.5 text-[12px] font-semibold leading-snug">{w("S3-RD-EX1")}</span>
          </div>
        ),
      },
      {
        side: "end",
        at: "top-[64%] -end-[30%] lg:-end-[46%]",
        node: <div className="max-w-[180px] rounded-2xl bg-[#FBEFD0] px-3 py-2 text-[12px] font-semibold leading-snug text-[#14101F] shadow-[0_18px_40px_-16px_rgba(8,5,26,0.55)]">{w("S3-RD-EX2")}</div>,
      },
    ];
  }
  if (step === 2) {
    return [
      {
        side: "end",
        at: "top-[10%] -end-[30%] lg:-end-[48%]",
        node: (
          <div className={`${card} w-[190px] px-3 py-2.5`}>
            <span className="inline-block rounded-md bg-[#F4C660] px-1.5 py-0.5 text-[10px] font-bold">{w("S4-CLOSEST")}</span>
            <span className="mt-1.5 flex items-center gap-1.5 text-[14px] font-extrabold">
              <span className="text-[#E0A33A]">★</span>
              {EXAMPLE.job[locale]}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1">
              <span className="rounded-md bg-[#EEEBF6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#4B3D82] first-letter:uppercase">{w("S4-PH-TOGETHER")}</span>
              <span className="rounded-md bg-[#FBEFD0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#7A5A12]">{w("DRV-IMP-NAME")}</span>
              <span className="rounded-md bg-[#FBEFD0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#7A5A12]">{w("DRV-MAS-NAME")}</span>
            </span>
          </div>
        ),
      },
      {
        side: "start",
        at: "top-[56%] -start-[32%] lg:-start-[48%]",
        node: (
          <div className={`${card} max-w-[200px] px-3 py-2.5`}>
            <span className="block text-[10.5px] font-semibold text-[#5C5142]">{w("S4-STUDY-LABEL")}</span>
            <span className="mt-1.5 flex flex-wrap gap-1">
              {EXAMPLE.study[locale].map((field) => (
                <span key={field} className="rounded-full bg-[#EEEBF6] px-2 py-0.5 text-[11px] font-semibold text-[#4B3D82]">
                  {field}
                </span>
              ))}
            </span>
          </div>
        ),
      },
    ];
  }
  return [
    {
      side: "start",
      at: "top-[18%] -start-[26%] lg:-start-[40%]",
      node: (
        <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#F4C660] to-[#F2A8B3] p-1 shadow-[0_18px_40px_-16px_rgba(8,5,26,0.6)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kai/avatar/kai-avatar-talk.webp" alt="" width={56} height={56} className="rounded-full" />
        </div>
      ),
    },
    {
      side: "end",
      at: "-bottom-[4%] -end-[18%] lg:bottom-auto lg:top-[80%] lg:-end-[36%]",
      node: (
        <div className={`${darkCard} flex items-center gap-2 px-3 py-2`}>
          <span className="text-[#F4C660]">✦</span>
          <span className="whitespace-nowrap text-[12.5px] font-bold">{locale === "ar" ? "اسأل أي شيء" : "Ask anything"}</span>
        </div>
      ),
    },
  ];
}

/**
 * Pieces of the report that pop out of the phone for the active step and
 * drift gently while it stays. They come from the screen's centre, so the
 * phone reads as the source.
 */
export function Popouts({ active }: { active: number }) {
  const { locale, t } = useLocale();
  const isRtl = locale === "ar";
  const pieces = piecesFor(active, locale, t("core.glance.you"));

  return (
    <AnimatePresence mode="popLayout">
      {pieces.map((piece, i) => {
        const inward = (piece.side === "start" ? 1 : -1) * (isRtl ? -1 : 1) * 70;
        return (
          <motion.div
            key={`${active}-${i}`}
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 ${piece.at}`}
            initial={{ opacity: 0, scale: 0.5, x: inward, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.12 + i * 0.09 }}
          >
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}>
              {piece.node}
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
