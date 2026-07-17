"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { GoldButton, GhostButton } from "./Shared";
import { KaiBubble } from "./KaiGuide";
import { Chapter } from "./Storybook";

/**
 * Night chapter of the Daybreak arc, pinned as one continuous shot:
 * phase 1 — camera pushes into the crossroads diorama while the copy reads;
 * phase 2 — the dawn gradient replaces the scene and Chapter Two fades in.
 */
export const ScrollWorldHero = () => {
  const ref = useRef(null);
  const phaseRef = useRef<"night" | "transition" | "dawn">("night");
  const [phase, setPhase] = useState<"night" | "transition" | "dawn">("night");
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1.5]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);
  const copyY = useTransform(scrollYProgress, [0, 0.42], [0, -40]);
  const kaiY = useTransform(scrollYProgress, [0, 0.45], [0, 60]);
  const vignette = useTransform(scrollYProgress, [0, 0.5], [0.55, 0.35]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const sunY = useTransform(scrollYProgress, [0.55, 0.95], ["36vh", "4vh"]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const nextPhase =
      progress >= 0.66 ? "dawn" : progress >= 0.42 ? "transition" : "night";

    if (nextPhase !== phaseRef.current) {
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
    }
  });

  const hasLeftNight = phase !== "night";
  const isDawn = phase === "dawn";

  return (
    <section
      ref={ref}
      id="top"
      className="relative h-[190vh] bg-[#08051A]"
      data-testid="hero"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* diorama */}
        <motion.img
          src="/marketing/daybreak/scroll-world/crossroads-kai.jpg"
          srcSet="/marketing/daybreak/scroll-world/crossroads-kai-m.jpg 1200w, /marketing/daybreak/scroll-world/crossroads-kai.jpg 2400w"
          sizes="100vw"
          alt="A miniature night-time world: Kai stands at a glowing crossroads holding a golden compass, paths leading to a university and a city, aurora above"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[68%_50%] sm:object-[42%_50%] xl:object-center"
          style={reduce ? {} : { scale, y: imgY }}
        />
        {/* legibility scrim */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: reduce ? 0.5 : vignette,
            background:
              "linear-gradient(180deg, rgba(8,5,26,0.75) 0%, rgba(8,5,26,0.15) 40%, rgba(8,5,26,0.05) 60%, rgba(8,5,26,0.8) 100%)",
          }}
        />
        {/* copy-side scrim so the headline zone always reads over the scene */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-full sm:w-[60%] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,5,26,0.72) 0%, rgba(8,5,26,0.42) 55%, transparent 100%)",
          }}
        />

        {/* The opaque gradient replaces the diorama before Chapter Two appears. */}
        <motion.div
          aria-hidden
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${
            hasLeftNight ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "var(--dawn-band)",
          }}
        />
        <motion.div
          aria-hidden
          className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-[52vh] h-[52vh] rounded-full pointer-events-none transition-opacity duration-700 ease-out ${
            isDawn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            y: reduce ? 0 : sunY,
            background:
              "radial-gradient(circle, rgba(244,198,96,0.95) 0%, rgba(244,169,124,0.55) 42%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
        <motion.div
          className={`absolute inset-x-0 top-[26vh] px-6 text-center pointer-events-none transition-all duration-500 ease-out ${
            isDawn ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <Chapter n="Two" title="First Light" tone="night" className="mb-4" />
          <p className="font-heading text-3xl sm:text-5xl font-semibold leading-snug text-[#F5EEE6] drop-shadow-[0_2px_18px_rgba(34,18,72,0.45)]">
            Every night ends.
            <br />
            Let’s find your daybreak.
          </p>
        </motion.div>

        {/* copy */}
        <motion.div
          style={reduce ? {} : { y: copyY }}
          className={`absolute inset-0 flex flex-col justify-center pt-20 px-6 lg:px-[7%] transition-opacity duration-500 ease-out ${
            hasLeftNight ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="max-w-4xl mx-auto text-center sm:mx-0 sm:max-w-xl sm:text-left">
            <Chapter
              n="One"
              title="The Crossroads"
              tone="night"
              className="mb-6"
            />
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 18,
                delay: 0.15,
              }}
              data-testid="hero-headline"
              className="font-heading text-4xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.05] font-semibold text-[#F5EEE6]"
            >
              Lost at the crossroads?
              <br />
              <span className="text-aurora">Daybreak is coming.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 18,
                delay: 0.3,
              }}
              className="mt-6 text-lg sm:text-xl text-[#F5EEE6]/95 leading-relaxed max-w-2xl mx-auto sm:mx-0 sm:max-w-sm"
            >
              Career clarity for MENA youth — with Kai as your guide.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 18,
                delay: 0.44,
              }}
              className="mt-10 flex flex-col sm:flex-row justify-center sm:justify-start gap-4"
            >
              <GoldButton href="/start" data-testid="hero-cta-start">
                Take the Assessment
              </GoldButton>
              <GhostButton href="#how" data-testid="hero-cta-how">
                How it works
              </GhostButton>
            </motion.div>
          </div>
        </motion.div>

        {/* Kai’s greeting — she’s standing in the scene itself */}
        <motion.div
          style={reduce ? {} : { y: kaiY }}
          className={`absolute bottom-[16%] sm:bottom-[20%] right-[3%] sm:right-[8%] lg:right-[14%] pointer-events-none transition-opacity duration-500 ease-out ${
            hasLeftNight ? "opacity-0" : "opacity-100"
          }`}
          data-testid="hero-kai"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 16,
              delay: 1.1,
            }}
          >
            <KaiBubble
              tone="night"
              tail="left"
              className="hidden sm:block w-60 text-[15px] leading-snug"
            >
              Ahlan! I’m{" "}
              <span className="font-semibold text-[#F4C660]">Kai</span>. Scroll
              with me — I know these roads.
            </KaiBubble>
          </motion.div>
        </motion.div>

        {/* scroll hint */}
        <motion.div
          style={reduce ? {} : { opacity: hintOpacity }}
          className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 text-[#F5EEE6]/50 pointer-events-none"
        >
          <span className="text-[11px] uppercase tracking-[0.25em]">
            Scroll to fly in
          </span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-px h-8 bg-gradient-to-b from-[#F4C660] to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
};
