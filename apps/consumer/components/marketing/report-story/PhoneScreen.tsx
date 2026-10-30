"use client";

import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { coreWording } from "@/lib/core-v2/content/core-content";
import { EXAMPLE, REPORT_SHOTS, SHOT_WIDTH } from "./story-data";

/** Screen box inside the bezel, as width / height. */
const SCREEN_RATIO = 284 / 604;
/** The last part of each step holds still, so the reader can take the screen in. */
const SCROLL_SHARE = 0.85;

interface PhoneScreenProps {
  active: number;
  /** 0 → 1 through the active step. */
  local: MotionValue<number>;
}

/**
 * One phone for the whole story. Steps 1 to 3 show the real example report
 * and scroll it as the page scrolls; step 4 is Kai's chat, which fills in as
 * the reader scrolls.
 */
export function PhoneScreen({ active, local }: PhoneScreenProps) {
  const { locale } = useLocale();
  const shots = REPORT_SHOTS[locale];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#F4EEE3]">
      {shots.map((shot, i) => (
        <ReportLayer key={shot.src} src={shot.src} height={shot.height} visible={active === i} local={local} />
      ))}
      <AnimatePresence>{active === shots.length ? <KaiChat key="kai" local={local} /> : null}</AnimatePresence>
    </div>
  );
}

function ReportLayer({
  src,
  height,
  visible,
  local,
}: {
  src: string;
  height: number;
  visible: boolean;
  local: MotionValue<number>;
}) {
  // Share of the image that can scroll past the screen.
  const imageInWidths = height / SHOT_WIDTH;
  const screenInWidths = 1 / SCREEN_RATIO;
  const travel = Math.max(0, (imageInWidths - screenInWidths) / imageInWidths);
  const y = useTransform(local, (v) => `${-Math.min(1, v / SCROLL_SHARE) * travel * 100}%`);

  return (
    <motion.div
      aria-hidden={!visible}
      className="absolute inset-0"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.96 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img src={src} alt="" loading="lazy" className="block w-full" style={visible ? { y } : undefined} />
    </motion.div>
  );
}

/** Step 4: Kai asks the report's own question, the student answers, Kai follows up. */
function KaiChat({ local }: { local: MotionValue<number> }) {
  const { locale } = useLocale();
  const [stage, setStage] = useState(0);
  useMotionValueEvent(local, "change", (v) => {
    const next = v < 0.12 ? 0 : v < 0.3 ? 1 : v < 0.45 ? 2 : v < 0.62 ? 3 : 4;
    setStage((cur) => (cur === next ? cur : next));
  });

  const bubble = { initial: { opacity: 0, y: 14, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 } };
  return (
    <motion.div
      className="absolute inset-0 flex flex-col bg-[#F4EEE3]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#14101F]/10 bg-[#FFFCF6] px-4 pb-3 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kai/avatar/kai-avatar-idle.webp" alt="" width={34} height={34} className="rounded-full" />
        <div className="grid leading-tight">
          <span className="text-[14px] font-bold text-[#14101F]">{locale === "ar" ? "كاي" : "Kai"}</span>
          <span className="text-[11px] text-[#5C5142]">{locale === "ar" ? "مدرّبك المهني الذكي" : "Your AI coach"}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-3.5 py-4 text-[13px] leading-snug">
        <motion.p {...bubble} className="max-w-[86%] self-start rounded-2xl rounded-ss-md bg-[#EEEBF6] px-3.5 py-2.5 font-semibold text-[#2B2154]">
          {coreWording(locale, "S3-KAI-Q")}
        </motion.p>
        <AnimatePresence>
          {stage >= 2 ? (
            <motion.p key="reply" {...bubble} className="max-w-[80%] self-end rounded-2xl rounded-se-md bg-[#6D5BA8] px-3.5 py-2.5 text-white">
              {EXAMPLE.reply[locale]}
            </motion.p>
          ) : null}
          {stage === 1 || stage === 3 ? <TypingDots key={`typing-${stage}`} self={stage === 1 ? "end" : "start"} /> : null}
          {stage >= 4 ? (
            <motion.p key="follow" {...bubble} className="max-w-[86%] self-start rounded-2xl rounded-ss-md bg-[#EEEBF6] px-3.5 py-2.5 text-[#2B2154]">
              {EXAMPLE.followUp[locale]}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="mx-3 mb-4 flex items-center gap-2 rounded-full border border-[#14101F]/10 bg-[#FFFCF6] px-4 py-2.5">
        <span className="flex-1 text-[12px] text-[#5C5142]/70">{locale === "ar" ? "اكتب لكاي…" : "Message Kai…"}</span>
        <span className="grid size-6 place-items-center rounded-full bg-[#F4C660] text-[12px] font-bold text-[#14101F] rtl:-scale-x-100">→</span>
      </div>
    </motion.div>
  );
}

function TypingDots({ self }: { self: "start" | "end" }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      className={`flex gap-1 rounded-2xl px-3.5 py-3 ${self === "end" ? "self-end bg-[#6D5BA8]/80" : "self-start bg-[#EEEBF6]"}`}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`size-1.5 rounded-full ${self === "end" ? "bg-white" : "bg-[#6D5BA8]"}`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.span>
  );
}
