"use client";

import { Check, Star } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { coreWording } from "@/lib/core-v2/content/core-content";
import { CURIOSITY_CODES } from "@/lib/core-v2/types";

/** The two hands-on curiosities CORE split out of Holland's single "realistic" type. */
const HANDS_ON = new Set(["IR", "AE"]);

const CIRCLE_COPY = {
  en: {
    title: "The circle of curiosities",
    neighbours: "Neighbours are related",
    opposites: "Opposites pull apart",
    split: "The hands-on type, split in two",
  },
  ar: {
    title: "دائرة الفضول",
    neighbours: "المتجاوران مترابطان",
    opposites: "المتقابلان متباعدان",
    split: "النوع العملي، مقسومًا إلى قسمين",
  },
} as const;

/**
 * CORE's eight curiosities in their circle order (CURIOSITY_CODES): related
 * interests sit next to each other, opposite ones across the circle. The two
 * hands-on curiosities, split from one Holland type, are marked in gold.
 */
export function CuriosityCircle() {
  const { locale } = useLocale();
  const copy = CIRCLE_COPY[locale];
  const R = 30; // ring radius, % of the box
  const nodes = CURIOSITY_CODES.map((code, i) => {
    const a = ((-90 + i * 45) * Math.PI) / 180;
    return { code, x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a), lx: 50 + (R + 17) * Math.cos(a), ly: 50 + (R + 12) * Math.sin(a) };
  });

  return (
    <figure className="grid items-center gap-8 rounded-[32px] bg-[#08051A] p-6 text-[#F5EEE6] sm:p-10 lg:grid-cols-[1fr_0.8fr]">
      <div dir="ltr" className="relative mx-auto aspect-square w-full max-w-[460px]">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#C8B6F0" strokeOpacity="0.35" strokeWidth="0.5" />
          {nodes.slice(0, 4).map((n, i) => {
            const o = nodes[i + 4];
            return <line key={n.code} x1={n.x} y1={n.y} x2={o.x} y2={o.y} stroke="#C8B6F0" strokeOpacity="0.18" strokeWidth="0.35" strokeDasharray="1 1.4" />;
          })}
          {nodes.map((n) => (
            <circle key={n.code} cx={n.x} cy={n.y} r={HANDS_ON.has(n.code) ? 3.2 : 2.6} fill={HANDS_ON.has(n.code) ? "#F4C660" : "#9D7FF0"} />
          ))}
          <path
            d={`M ${nodes[6].x} ${nodes[6].y} A ${R} ${R} 0 0 1 ${nodes[7].x} ${nodes[7].y}`}
            fill="none"
            stroke="#F4C660"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        {nodes.map((n) => (
          <span
            key={n.code}
            lang={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
            className={`absolute w-[24%] -translate-x-1/2 -translate-y-1/2 text-center text-[11px] font-semibold leading-tight sm:text-[13px] ${
              HANDS_ON.has(n.code) ? "text-[#F4C660]" : "text-[#F5EEE6]/85"
            }`}
            style={{ left: `${n.lx}%`, top: `${n.ly}%` }}
          >
            {coreWording(locale, `CUR-${n.code}-NAME`)}
          </span>
        ))}
      </div>
      <figcaption className="grid gap-5">
        <span className="font-heading text-3xl font-semibold leading-tight">{copy.title}</span>
        <ul className="grid gap-3 text-[15px] text-[#F5EEE6]/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-[#C8B6F0]/60" />
            {copy.neighbours}
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 border-t border-dashed border-[#C8B6F0]/50" />
            {copy.opposites}
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-[#F4C660]" />
            {copy.split}
          </li>
        </ul>
      </figcaption>
    </figure>
  );
}

const CHOOSE_COPY = {
  en: { rate: "Rate each one from 1 to 5", choose: "Choose between them", options: ["Fix the bike", "Design the poster", "Help a friend study"] },
  ar: { rate: "قيّم كل خيار من 1 إلى 5", choose: "اختر بينها", options: ["إصلاح الدراجة", "تصميم الملصق", "مساعدة صديق في الدراسة"] },
} as const;

/** Why CORE asks you to choose: rated, everything you like gets a 5; chosen, an order shows. */
export function ChooseNotRate() {
  const { locale } = useLocale();
  const copy = CHOOSE_COPY[locale];
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-2.5 rounded-2xl border border-[var(--day-line)] bg-[var(--day-card)] p-4">
        <span className="text-[12px] font-semibold text-[var(--day-ink-3)]">{copy.rate}</span>
        {copy.options.map((o) => (
          <span key={o} className="flex items-center justify-between gap-3 text-[13px] font-semibold">
            {o}
            <span className="flex gap-0.5 text-[#E0A33A]">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
            </span>
          </span>
        ))}
      </div>
      <div className="grid gap-2 rounded-2xl bg-[#EEEBF6] p-4">
        <span className="text-[12px] font-semibold text-[#4B3D82]">{copy.choose}</span>
        {copy.options.map((o, i) => (
          <span
            key={o}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold ${
              i === 1 ? "bg-[#6D5BA8] text-white" : "bg-white/70 text-[#2E2650]"
            }`}
          >
            {o}
            {i === 1 ? <Check className="size-4" /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
