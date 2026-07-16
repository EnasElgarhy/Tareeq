"use client";

import type { ReactNode } from "react";

interface FeedCarouselProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * A horizontally-scrolling section: a title row plus an edge-bleeding row
 * of cards that snap as you swipe (the Headway / Speechify pattern). The
 * row extends to the screen edge via -mx-5 + px-5 so cards peek off-frame.
 */
export function FeedCarousel({
  title,
  subtitle,
  badge,
  children,
}: FeedCarouselProps) {
  return (
    <section className="daybreak-reveal grid gap-3">
      <div className="flex items-center gap-2">
        <h2 className="daybreak-heading text-[22px] leading-tight text-[color:var(--day-ink)]">
          {title}
        </h2>
        {badge}
      </div>
      {subtitle ? (
        <p className="-mt-1 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {subtitle}
        </p>
      ) : null}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
