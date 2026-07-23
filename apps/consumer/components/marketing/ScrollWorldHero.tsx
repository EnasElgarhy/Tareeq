"use client";

import { useEffect, useRef, useState } from "react";
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

const WORLD_VIDEO_SRC =
  "/marketing/daybreak/scroll-world-v2/tareeq-scroll-world-prototype-v2-720p.mp4";
const WORLD_VIDEO_END = 0.72;
const DAWN_START = 0.79;
const DAWN_HANDOFF = 0.93;

/**
 * Night chapter of the Daybreak arc, pinned as one continuous shot:
 * phase 1 — camera pushes into the crossroads diorama while the copy reads;
 * phase 2 — the dawn gradient replaces the scene and Chapter Two fades in.
 */
export const ScrollWorldHero = () => {
  const ref = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoDurationRef = useRef(0);
  const targetTimeRef = useRef(0);
  const progressRef = useRef(0);
  const blobUrlRef = useRef<string | null>(null);
  const introVisibleRef = useRef(true);
  const phaseRef = useRef<"night" | "transition" | "dawn">("night");
  const [phase, setPhase] = useState<"night" | "transition" | "dawn">("night");
  const [introVisible, setIntroVisible] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
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
  const sunY = useTransform(scrollYProgress, [0.55, 0.95], ["36vh", "4vh"]);

  const seekToTarget = () => {
    const video = videoRef.current;
    const duration = videoDurationRef.current;

    if (!video || duration <= 0 || video.readyState < 1 || video.seeking) {
      return;
    }

    const nextTime = Math.min(
      Math.max(targetTimeRef.current, 0),
      Math.max(duration - 0.001, 0),
    );

    if (Math.abs(video.currentTime - nextTime) > 0.025) {
      video.currentTime = nextTime;
    }
  };

  useEffect(() => {
    if (reduce || window.matchMedia("(max-width: 639px)").matches) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    // A local Blob makes the entire film seekable, even when the host does not
    // provide reliable byte-range requests.
    fetch(WORLD_VIDEO_SRC, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load scroll world: ${response.status}`);
        }

        return response.blob();
      })
      .then((blob) => {
        if (!active) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setVideoSrc(objectUrl);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        // The normal URL can still scrub when the server supports ranges.
        setVideoSrc(WORLD_VIDEO_SRC);
      });

    return () => {
      active = false;
      controller.abort();

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [reduce]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    progressRef.current = progress;
    const scrubProgress = Math.min(progress / WORLD_VIDEO_END, 1);
    targetTimeRef.current = scrubProgress * videoDurationRef.current;
    seekToTarget();

    const nextIntroVisible = progress < 0.18;
    if (nextIntroVisible !== introVisibleRef.current) {
      introVisibleRef.current = nextIntroVisible;
      setIntroVisible(nextIntroVisible);
    }

    const nextPhase =
      progress >= DAWN_HANDOFF
        ? "transition"
        : progress >= DAWN_START
          ? "dawn"
          : progress >= WORLD_VIDEO_END
            ? "transition"
            : "night";

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
      className="relative h-[165vh] bg-[#08051A] sm:h-[420vh] motion-reduce:sm:h-[175vh]"
      data-testid="hero"
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Desktop scroll controls the film. Mobile keeps the approved still
            until a dedicated portrait render is available. */}
        <motion.video
          ref={videoRef}
          src={videoSrc ?? undefined}
          muted
          playsInline
          preload="auto"
          poster="/marketing/daybreak/scroll-world-v2/storyboards/01-crossroads-v2.png"
          aria-hidden
          data-testid="hero-video"
          className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            video.pause();
            videoDurationRef.current = video.duration;
            const scrubProgress = Math.min(
              progressRef.current / WORLD_VIDEO_END,
              1,
            );
            targetTimeRef.current = scrubProgress * video.duration;
            seekToTarget();
          }}
          onLoadedData={seekToTarget}
          onSeeked={() => requestAnimationFrame(seekToTarget)}
        />
        <picture className="absolute inset-0 block overflow-hidden sm:hidden">
          <motion.img
            src="/marketing/daybreak/scroll-world-v2/storyboards/01-crossroads-v2.png"
            sizes="100vw"
            alt="Kai guides a university student toward a compass at a crossroads beneath the aurora"
            fetchPriority="high"
            className="h-full w-full object-cover object-[72%_center]"
            style={reduce ? {} : { scale, y: imgY }}
          />
        </picture>
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
          className="absolute inset-y-0 left-0 hidden w-[62%] pointer-events-none sm:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,5,26,0.72) 0%, rgba(8,5,26,0.42) 55%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,5,26,0.08) 20%, rgba(8,5,26,0.42) 48%, rgba(8,5,26,0.94) 100%)",
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
          className={`absolute inset-x-0 top-[30vh] px-6 text-center pointer-events-none transition-all duration-500 ease-out sm:top-[26vh] ${
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
          className={`absolute inset-0 flex flex-col justify-end px-5 pb-8 pt-24 transition-opacity duration-500 ease-out sm:justify-center sm:px-6 sm:pb-0 sm:pt-20 lg:px-[7%] ${
            introVisible ? "opacity-100" : "opacity-0"
          } ${hasLeftNight ? "invisible" : ""}`}
        >
          <div className="w-full max-w-[42rem] text-left">
            <Chapter
              n="One"
              title="The Crossroads"
              tone="night"
              className="mb-4 sm:mb-5"
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
              className="font-heading text-[2.4rem] font-semibold leading-[1.03] text-[#F5EEE6] sm:text-5xl lg:text-[3.75rem]"
            >
              <span className="block sm:whitespace-nowrap">
                Lost at the crossroads?
              </span>
              <span className="text-aurora block sm:whitespace-nowrap">
                Daybreak is coming.
              </span>
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
              className="mt-4 max-w-sm text-base leading-relaxed text-[#F5EEE6]/90 sm:mt-5 sm:text-lg"
            >
              Career clarity for MENA youth, guided by Kai.
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
              className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-row sm:justify-start sm:gap-4"
            >
              <GoldButton
                href="/start"
                data-testid="hero-cta-start"
                className="px-4 py-3 text-sm sm:px-8 sm:py-4 sm:text-base"
              >
                Start assessment
              </GoldButton>
              <GhostButton
                href="#how"
                data-testid="hero-cta-how"
                className="px-4 py-3 text-sm sm:px-8 sm:py-4 sm:text-base"
              >
                How it works
              </GhostButton>
            </motion.div>
          </div>
        </motion.div>

        {/* Kai’s greeting — she’s standing in the scene itself */}
        <motion.div
          style={reduce ? {} : { y: kaiY }}
          className={`absolute bottom-[16%] sm:bottom-[20%] right-[3%] sm:right-[8%] lg:right-[14%] pointer-events-none transition-opacity duration-500 ease-out ${
            introVisible ? "opacity-100" : "opacity-0"
          } ${hasLeftNight ? "invisible" : ""}`}
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
              <span className="font-semibold text-[#F4C660]">Kai</span>. We’ll
              find the path that fits you.
            </KaiBubble>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
