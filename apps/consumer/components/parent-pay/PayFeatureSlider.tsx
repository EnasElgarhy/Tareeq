"use client";

import { ArrowDown, ChevronLeft, ChevronRight, ListOrdered, Search, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fill } from "@/components/results/report-access/story/story-data";
import type { StringKey } from "@/lib/i18n/strings";
import styles from "./parent-pay.module.css";

interface Slide {
  title: StringKey;
  body: StringKey;
  art: ReactNode;
}

/**
 * Four swipeable slides showing what the report holds, with example cards.
 * Native horizontal scroll with snap points, so touch, trackpad and keyboard
 * all work; the arrows and dots only scroll it.
 */
export function PayFeatureSlider({ audience = "parent" }: { audience?: "parent" | "student" }) {
  const { t } = useLocale();
  // The student reads the same slides about themselves ("your", not "their").
  const say = (key: StringKey): StringKey =>
    audience === "student" ? (`${key}.you` as StringKey) : key;
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    { title: "pay.slide.curiosity.title", body: "pay.slide.curiosity.body", art: <CuriosityArt /> },
    { title: "pay.slide.work.title", body: "pay.slide.work.body", art: <WorkArt say={say} /> },
    { title: "pay.slide.lead.title", body: "pay.slide.lead.body", art: <LeadArt say={say} /> },
    { title: "pay.slide.kai.title", body: "pay.slide.kai.body", art: <KaiArt /> },
  ];
  const last = slides.length - 1;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(last, next));
    // RTL tracks scroll towards negative offsets.
    const sign = getComputedStyle(track).direction === "rtl" ? -1 : 1;
    track.scrollTo({ left: sign * target * track.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    // `scrollLeft` is negative in RTL, so read its size only.
    setIndex(Math.round(Math.abs(track.scrollLeft) / track.clientWidth));
  }

  return (
    <section className={styles.slider} aria-roledescription="carousel">
      <div ref={trackRef} className={styles.track} onScroll={handleScroll}>
        {slides.map((slide, i) => (
          <article
            key={slide.title}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}: ${t(say(slide.title))}`}
          >
            <div className={styles.stage}>{slide.art}</div>
            <div className={styles.slideText}>
              <h2 className={`daybreak-heading ${styles.slideTitle}`}>{t(say(slide.title))}</h2>
              <p>{t(say(slide.body))}</p>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.sliderNav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label={t("pay.slide.prev")}
        >
          <ChevronLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              className={styles.dot}
              data-active={i === index}
              aria-current={i === index}
              aria-label={fill(t("pay.slide.show"), { title: t(say(slide.title)) })}
              onClick={() => goTo(i)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goTo(index + 1)}
          disabled={index === last}
          aria-label={t("pay.slide.next")}
        >
          <ChevronRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
      </div>
    </section>
  );
}

function CuriosityArt() {
  const { t } = useLocale();
  return (
    <>
      <Image src="/pay/fan-curiosity.jpg" alt="" width={430} height={240} className={styles.artWide} priority />
      <div className={styles.vignette} />
      <div className={`${styles.glass} ${styles.bob} ${styles.curiosityCard}`}>
        <div className={styles.cardHead}>
          <span className={styles.iconCircle}>
            <Search size={17} aria-hidden="true" />
          </span>
          <span>
            <strong className="daybreak-heading">{t("pay.slide.curiosity.card")}</strong>
            <small>{t("pay.slide.curiosity.card_sub")}</small>
          </span>
        </div>
        <p>{t("pay.slide.curiosity.card_body")}</p>
      </div>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipCuriosity}`}>
        <span className={styles.chipDot} style={{ background: "#8FD3B6" }}>
          <Users size={12} aria-hidden="true" />
        </span>
        {t("pay.slide.curiosity.chip")}
      </span>
    </>
  );
}

type Say = (key: StringKey) => StringKey;

function WorkAxis({
  label,
  a,
  b,
  icon,
  say,
}: {
  label: StringKey;
  a: StringKey;
  b: StringKey;
  icon: ReactNode;
  say: Say;
}) {
  const { t } = useLocale();
  return (
    <div className={styles.axis}>
      <span className={styles.axisLabel}>{t(say(label))}</span>
      <div className={styles.axisTrack} aria-hidden="true">
        <span className={styles.axisFill} />
        <span className={styles.axisMid} />
        <span className={styles.axisKnob} />
      </div>
      <div className={styles.axisEnds}>
        <span className={styles.axisOn}>
          <span className={styles.axisIcon}>{icon}</span>
          {t(a)}
        </span>
        <span className={styles.axisOff}>{t(b)}</span>
      </div>
    </div>
  );
}

function WorkArt({ say }: { say: Say }) {
  const { t } = useLocale();
  return (
    <>
      <div className={styles.glow} />
      <div className={`${styles.glass} ${styles.bob} ${styles.workCard}`}>
        <span className={styles.workHead}>
          <span className={styles.letter} style={{ background: "linear-gradient(160deg,#5FB48E,#2F7457)" }}>O</span>
          <strong className="daybreak-heading">{t(say("pay.slide.work.card"))}</strong>
        </span>
        <WorkAxis
          say={say}
          label="pay.slide.work.axis1"
          a="pay.slide.work.axis1.a"
          b="pay.slide.work.axis1.b"
          icon={<ListOrdered size={13} aria-hidden="true" />}
        />
        <WorkAxis
          say={(key) => key}
          label="pay.slide.work.axis2"
          a="pay.slide.work.axis2.a"
          b="pay.slide.work.axis2.b"
          icon={<ArrowDown size={13} aria-hidden="true" />}
        />
      </div>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipWork}`}>
        <span className={styles.letterSmall} style={{ background: "#6D5BA8" }}>E</span>
        {t("pay.slide.work.chip")}
      </span>
    </>
  );
}

function LeadArt({ say }: { say: Say }) {
  const { t } = useLocale();
  const jobs: StringKey[] = ["pay.slide.lead.job1", "pay.slide.lead.job2", "pay.slide.lead.job3"];
  return (
    <>
      <Image src="/pay/fan-families.jpg" alt="" width={360} height={270} className={styles.artStart} />
      <div className={`${styles.glass} ${styles.leadBack}`}>{t("pay.slide.lead.back")}</div>
      <div className={`${styles.glass} ${styles.bob} ${styles.leadCard}`}>
        <strong className="daybreak-heading">{t("pay.slide.lead.family")}</strong>
        <ul>
          {jobs.map((job) => (
            <li key={job}>{t(job)}</li>
          ))}
        </ul>
      </div>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipLeadTop}`}>{t(say("pay.slide.lead.chip"))}</span>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipLead}`}>
        <span className={styles.letterSmall} style={{ background: "#A8544A" }}>R</span>
        {t("pay.slide.lead.chip2")}
      </span>
    </>
  );
}

function KaiArt() {
  const { t } = useLocale();
  return (
    <>
      <Image src="/pay/kai-bubbles.jpg" alt="" width={360} height={270} className={styles.artEnd} />
      <div className={`${styles.glass} ${styles.bob} ${styles.kaiCard}`}>
        <Image src="/kai/avatar/kai-avatar-idle.webp" unoptimized alt="Kai" width={54} height={54} className={styles.kaiAvatar} />
        <span>
          <span className={styles.kaiName}>
            <Sparkles size={14} aria-hidden="true" />
            Kai
          </span>
          <span>{t("pay.slide.kai.bubble")}</span>
        </span>
      </div>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipKai1}`}>{t("pay.slide.kai.chip1")}</span>
      <span className={`${styles.chip} ${styles.bob2} ${styles.chipKai2}`}>{t("pay.slide.kai.chip2")}</span>
    </>
  );
}
