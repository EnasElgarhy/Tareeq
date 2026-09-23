"use client";

import {
  Lock,
  MessageCircle,
  Compass,
  ClipboardCheck,
  Layers,
  TrendingUp,
  Map,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { trackEvent } from "@/lib/analytics/track";
import { getReportOffer } from "@/lib/payments/report-access";
import type { StringKey } from "@/lib/i18n/strings";
import { fill, formatOfferPrice } from "@/components/results/report-access/story/story-data";

/** The surfaces that can be locked behind the report purchase. */
export type LockedFeature = "kai" | "explore" | "plans" | "overview";

const FEATURE_COPY: Record<
  LockedFeature,
  { titleKey: StringKey; subKey: StringKey; items: StringKey[] }
> = {
  kai: {
    titleKey: "access.kai.title",
    subKey: "access.kai.sub",
    items: [
      "kai.panel.locked.action_plans.title",
      "kai.panel.locked.explore.title",
      "kai.panel.locked.deep_dive.title",
    ],
  },
  explore: {
    titleKey: "access.explore.title",
    subKey: "access.explore.sub",
    items: [
      "paywall.explore.stop1",
      "paywall.explore.stop2",
      "paywall.explore.stop3",
      "paywall.explore.stop6",
      "paywall.explore.stop7",
    ],
  },
  plans: {
    titleKey: "access.plans.title",
    subKey: "access.plans.sub",
    items: [
      "paywall.locked.action_plan",
      "paywall.locked.skills",
      "paywall.locked.growth",
    ],
  },
  overview: {
    titleKey: "access.overview.title",
    subKey: "access.overview.sub",
    items: [
      "paywall.locked.careers",
      "paywall.locked.personality",
      "paywall.locked.decisions",
    ],
  },
};

const FEATURE_ICONS: Record<LockedFeature, string[]> = {
  kai: ["chat", "compass", "dive"],
  explore: ["map", "map", "map", "map", "map"],
  plans: ["plan", "skills", "growth"],
  overview: ["compass", "personality", "decisions"],
};

/**
 * Compass illustration — animated compass rose with glowing needle,
 * rotating outer ring, and pulsing cardinal points. Inspired by Tareeq's
 * compass brand and Moonly's mystical night sky aesthetic.
 */
function CompassIllustration({ feature }: { feature: LockedFeature }) {
  // Feature-specific accent color for the needle
  const needleColor = feature === "kai" ? "#f4c660" : feature === "explore" ? "#6fe0c0" : "#f4c660";
  const glowColor = feature === "kai" ? "#f4c660" : feature === "explore" ? "#6fe0c0" : "#f4c660";

  return (
    <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
      <defs>
        <radialGradient id="compass-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="needle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={needleColor} />
          <stop offset="100%" stopColor="#FF6B3D" />
        </linearGradient>
        <filter id="needle-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="tick-glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient glow — breathing */}
      <circle cx="100" cy="100" r="90" fill="url(#compass-glow)">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Outer ring — slow rotation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 100 100"
          to="360 100 100"
          dur="60s"
          repeatCount="indefinite"
        />
        {/* Outer ring */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#9d7ff0" strokeWidth="1" opacity="0.3" />
        {/* Tick marks around the ring */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 100 + 72 * Math.cos(angle);
          const y1 = 100 + 72 * Math.sin(angle);
          const x2 = 100 + 78 * Math.cos(angle);
          const y2 = 100 + 78 * Math.sin(angle);
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9d7ff0"
              strokeWidth={i % 6 === 0 ? "1.5" : "0.8"}
              opacity={i % 6 === 0 ? "0.5" : "0.25"}
            />
          );
        })}
      </g>

      {/* Inner ring — counter rotation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="360 100 100"
          to="0 100 100"
          dur="45s"
          repeatCount="indefinite"
        />
        <circle cx="100" cy="100" r="55" fill="none" stroke="#9d7ff0" strokeWidth="0.8" opacity="0.25" strokeDasharray="2 4" />
      </g>

      {/* Cardinal points — N, S, E, W with glow */}
      {[
        { x: 100, y: 20, label: "N" },
        { x: 180, y: 100, label: "E" },
        { x: 100, y: 180, label: "S" },
        { x: 20, y: 100, label: "W" },
      ].map((point, i) => (
        <g key={point.label} filter="url(#tick-glow)">
          <circle cx={point.x} cy={point.y} r="6" fill="#9d7ff0" opacity="0.4">
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur={`${2 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={point.x} cy={point.y} r="3" fill="#9d7ff0" opacity="0.7" />
          <circle cx={point.x} cy={point.y} r="1.5" fill="#F5EEE6" opacity="0.9" />
        </g>
      ))}

      {/* Compass needle — the hero element */}
      <g filter="url(#needle-glow)">
        {/* Needle shadow/glow */}
        <polygon
          points="100,35 106,100 100,165 94,100"
          fill="url(#needle-gradient)"
          opacity="0.3"
        >
          <animate
            attributeName="opacity"
            values="0.2;0.4;0.2"
            dur="3s"
            repeatCount="indefinite"
          />
        </polygon>
        {/* Needle body */}
        <polygon
          points="100,40 104,100 100,160 96,100"
          fill="url(#needle-gradient)"
          opacity="0.9"
        />
        {/* Needle center pivot */}
        <circle cx="100" cy="100" r="8" fill="#221248" stroke="url(#needle-gradient)" strokeWidth="2" />
        <circle cx="100" cy="100" r="4" fill="url(#needle-gradient)" />
        <circle cx="100" cy="100" r="2" fill="#F5EEE6" opacity="0.9" />
      </g>

      {/* Feature markers — small dots around the compass */}
      {[
        { x: 100, y: 45, color: "#f4c660", size: 4 },
        { x: 155, y: 100, color: "#6fe0c0", size: 3.5 },
        { x: 100, y: 155, color: "#f2a8b3", size: 4 },
        { x: 45, y: 100, color: "#9d7ff0", size: 3.5 },
      ].map((marker, i) => (
        <g key={`marker-${i}`}>
          <circle cx={marker.x} cy={marker.y} r={marker.size + 3} fill={marker.color} opacity="0.2">
            <animate
              attributeName="opacity"
              values="0.15;0.3;0.15"
              dur={`${2.5 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={marker.x} cy={marker.y} r={marker.size} fill={marker.color} opacity="0.85" />
          <circle cx={marker.x} cy={marker.y} r={marker.size * 0.5} fill="#F5EEE6" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Feature icons — Lucide icons for consistency.
 */
function LockedFeatureIcon({ kind }: { kind: string }) {
  const base = "grid size-10 shrink-0 place-items-center rounded-xl";
  const iconProps = { size: 18, strokeWidth: 2 };

  if (kind === "chat")
    return (
      <span className={`${base} bg-[#f4c660]/20 text-[#f4c660]`}>
        <MessageCircle {...iconProps} />
      </span>
    );
  if (kind === "compass")
    return (
      <span className={`${base} bg-[#9d7ff0]/20 text-[#9d7ff0]`}>
        <Compass {...iconProps} />
      </span>
    );
  if (kind === "dive")
    return (
      <span className={`${base} bg-[#6fe0c0]/20 text-[#6fe0c0]`}>
        <MessageCircle {...iconProps} />
      </span>
    );
  if (kind === "plan")
    return (
      <span className={`${base} bg-[#f4c660]/20 text-[#f4c660]`}>
        <ClipboardCheck {...iconProps} />
      </span>
    );
  if (kind === "skills")
    return (
      <span className={`${base} bg-[#f2a8b3]/20 text-[#f2a8b3]`}>
        <Layers {...iconProps} />
      </span>
    );
  if (kind === "growth")
    return (
      <span className={`${base} bg-[#6fe0c0]/20 text-[#6fe0c0]`}>
        <TrendingUp {...iconProps} />
      </span>
    );
  if (kind === "personality")
    return (
      <span className={`${base} bg-[#f2a8b3]/20 text-[#f2a8b3]`}>
        <Sparkles {...iconProps} />
      </span>
    );
  if (kind === "decisions")
    return (
      <span className={`${base} bg-[#f4c660]/20 text-[#f4c660]`}>
        <Compass {...iconProps} />
      </span>
    );
  return (
    <span className={`${base} bg-[#9d7ff0]/20 text-[#9d7ff0]`}>
      <Map {...iconProps} />
    </span>
  );
}

/**
 * Feature card with custom illustration for each feature type.
 */
function FeatureCard({ kind, text }: { kind: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#9d7ff0]/15 bg-[#100a24]/70 px-5 py-4 transition hover:border-[#9d7ff0]/30 hover:bg-[#100a24]/90">
      <div className="flex items-center gap-4">
        {/* Icon container */}
        <div className="relative shrink-0">
          <LockedFeatureIcon kind={kind} />
        </div>
        {/* Text */}
        <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-[#c8b6f0]/95">
          {text}
        </span>
        {/* Custom illustration on the right */}
        <div className="shrink-0">
          <FeatureIllustration kind={kind} />
        </div>
      </div>
    </div>
  );
}

/**
 * Custom illustration for each feature type - displayed on the right side of each card.
 */
function FeatureIllustration({ kind }: { kind: string }) {
  if (kind === "compass") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="22" stroke="#9d7ff0" strokeWidth="1.5" opacity="0.7" />
        <circle cx="28" cy="28" r="14" stroke="#9d7ff0" strokeWidth="1" opacity="0.5" strokeDasharray="2 3" />
        <path d="M28 12L31 24L28 28L25 24Z" fill="#9d7ff0" opacity="0.8" />
        <path d="M28 44L25 32L28 28L31 32Z" fill="#9d7ff0" opacity="0.4" />
        <circle cx="28" cy="28" r="3" fill="#9d7ff0" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "plan") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <rect x="12" y="8" width="32" height="40" rx="2" stroke="#f4c660" strokeWidth="1.5" opacity="0.7" />
        <line x1="16" y1="16" x2="40" y2="16" stroke="#f4c660" strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="24" x2="36" y2="24" stroke="#f4c660" strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="32" x2="38" y2="32" stroke="#f4c660" strokeWidth="1" opacity="0.6" />
        <circle cx="19" cy="16" r="2" fill="#f4c660" opacity="0.9" />
        <circle cx="19" cy="24" r="2" fill="#f4c660" opacity="0.9" />
        <circle cx="19" cy="32" r="2" fill="#f4c660" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "skills") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M28 8L38 18L28 28L18 18Z" fill="#f2a8b3" opacity="0.6" />
        <path d="M28 18L38 28L28 38L18 28Z" fill="#f2a8b3" opacity="0.5" />
        <path d="M28 28L38 38L28 48L18 38Z" fill="#f2a8b3" opacity="0.4" />
        <circle cx="28" cy="22" r="3" fill="#f2a8b3" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "growth") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M12 44L22 30L32 34L44 14" stroke="#6fe0c0" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="44" cy="14" r="4" fill="#6fe0c0" opacity="0.9" />
        <circle cx="32" cy="34" r="3" fill="#6fe0c0" opacity="0.7" />
        <circle cx="22" cy="30" r="3" fill="#6fe0c0" opacity="0.7" />
      </svg>
    );
  }
  if (kind === "chat") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M12 12H44V36H24L12 44V36H12V12Z" stroke="#f4c660" strokeWidth="1.5" opacity="0.7" />
        <circle cx="20" cy="24" r="2.5" fill="#f4c660" opacity="0.9" />
        <circle cx="28" cy="24" r="2.5" fill="#f4c660" opacity="0.9" />
        <circle cx="36" cy="24" r="2.5" fill="#f4c660" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "dive") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="18" stroke="#6fe0c0" strokeWidth="1.5" opacity="0.6" />
        <circle cx="28" cy="28" r="12" stroke="#6fe0c0" strokeWidth="1" opacity="0.5" />
        <path d="M28 16V32M20 24H36" stroke="#6fe0c0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      </svg>
    );
  }
  if (kind === "map") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M8 12L16 8L28 12L40 8L48 12V44L40 48L28 44L16 48L8 44V12Z" stroke="#9d7ff0" strokeWidth="1.5" opacity="0.7" />
        <path d="M16 8V48M28 12V44M40 8V48" stroke="#9d7ff0" strokeWidth="1" opacity="0.5" />
        <circle cx="28" cy="28" r="3" fill="#9d7ff0" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "personality") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M28 8L34 20L48 20L36 28L40 42L28 34L16 42L20 28L8 20L22 20Z" fill="#f2a8b3" opacity="0.6" />
        <circle cx="28" cy="26" r="4" fill="#f2a8b3" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "decisions") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="20" stroke="#f4c660" strokeWidth="1.5" opacity="0.6" />
        <path d="M28 12L31 24L28 28L25 24Z" fill="#f4c660" opacity="0.8" />
        <path d="M28 44L25 32L28 28L31 32Z" fill="#f4c660" opacity="0.4" />
        <circle cx="28" cy="28" r="3" fill="#f4c660" opacity="0.9" />
      </svg>
    );
  }
  return null;
}

/**
 * PaidFeatureLock — Constellation reveal concept.
 *
 * Inspired by Moonly's night sky, Co-Star's mystical aesthetic, and Grok's
 * clean feature list. The locked features appear as stars in a constellation —
 * some visible, some dimmed. The CTA promises to illuminate the full pattern.
 */
export function PaidFeatureLock({
  feature,
  className,
}: {
  feature: LockedFeature;
  className?: string;
}) {
  const { locale, t } = useLocale();
  const copy = FEATURE_COPY[feature];
  const offer = getReportOffer();
  const icons = FEATURE_ICONS[feature];
  const viewedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackEvent("locked_feature_viewed", { feature });
  }, [feature]);

  return (
    <section
      className={`relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-[#9d7ff0]/20 bg-gradient-to-b from-[#1a0f3d] via-[#1e1145] to-[#221248] ${className ?? ""}`}
      aria-labelledby={`locked-${feature}-heading`}
    >
      {/* Star field background */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#F5EEE6]"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Compass illustration */}
      <div className="relative px-8 pt-10 pb-6">
        <div className="mx-auto h-44 w-full max-w-[340px]">
          <CompassIllustration feature={feature} />
        </div>

        {/* Lock badge — top right, subtle */}
        <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full border border-[#9d7ff0]/30 bg-[#100a24]/90 px-3 py-1.5 backdrop-blur-md">
          <Lock size={11} strokeWidth={2.5} className="text-[#f4c660]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c8b6f0]">{t("access.lock.badge")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-8 pb-8">
        {/* Headline */}
        <div className="mb-6 text-center">
          <h2
            id={`locked-${feature}-heading`}
            className="text-display-3 mb-2.5 text-[#F5EEE6]"
          >
            {t(copy.titleKey)}
          </h2>
          <p className="mx-auto max-w-[44ch] text-lead text-[#c8b6f0]">
            {t(copy.subKey)}
          </p>
        </div>

        {/* Feature list */}
        <div className="mb-7">
          <p className="mb-3.5 flex items-center justify-center gap-2 text-eyebrow text-[#f4c660]">
            <Sparkles size={13} strokeWidth={2.25} />
            {t("access.lock.includes")}
          </p>
          <div className="grid gap-3">
            {copy.items.map((key, i) => (
              <FeatureCard key={key} kind={icons[i] ?? "map"} text={t(key)} />
            ))}
          </div>
        </div>

        {/* Pricing + CTA */}
        <div className="rounded-2xl border border-[#9d7ff0]/15 bg-[#100a24]/60 px-6 py-6">
          <div className="mb-5 flex items-baseline justify-center gap-3">
            <span className="text-[36px] font-bold leading-none tracking-tight text-[#F5EEE6]">
              {formatOfferPrice(offer, locale)}
            </span>
            {offer.discountPercent > 0 && (
              <span className="flex items-center gap-2">
                <s className="text-[13px] text-[#9d7ff0]/50">
                  <span className="sr-only">
                    {fill(t("paywall.offer.full_price"), {
                      price: formatOfferPrice(
                        { ...offer, amountMinor: offer.listAmountMinor },
                        locale,
                      ),
                    })}
                  </span>
                  <span aria-hidden="true">
                    {formatOfferPrice(
                      { ...offer, amountMinor: offer.listAmountMinor },
                      locale,
                    )}
                  </span>
                </s>
                <span className="whitespace-nowrap rounded-full bg-[#f4c660] px-3 py-1 text-[11px] font-bold text-[#221248]">
                  {fill(t("paywall.offer.percent_off"), {
                    percent: String(offer.discountPercent),
                  })}
                </span>
              </span>
            )}
          </div>

          <Link
            href="/compass"
            onClick={() =>
              trackEvent("locked_feature_unlock_clicked", { feature })
            }
            className="btn-v2 btn-v2--primary w-full"
            data-size="lg"
          >
            {t("paywall.v2.cta")}
            <ArrowRight size={18} strokeWidth={2.25} className="flip-rtl" />
          </Link>

          <p className="mt-4 text-center text-[12px] leading-relaxed text-[#c8b6f0]/70">
            {t("access.lock.note")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PaidAccessChecking({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div
      role="status"
      className={`flex flex-1 items-center justify-center px-6 py-16 text-center text-[13px] text-[color:var(--day-ink-3)] ${className ?? ""}`}
    >
      {t("access.lock.checking")}
    </div>
  );
}
