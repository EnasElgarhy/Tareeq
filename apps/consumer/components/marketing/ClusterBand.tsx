"use client";

import { Container, FadeIn, GradientText } from "./Shared";
import { CAREER_CLUSTERS } from "./WayIcons";

/** Cluster tones mirror lib/results/cluster-visuals.ts, so a cluster's icon
 *  is the same colour here as it is in the user's result. */
const TONES = [
  "#4F8DFF",
  "#FF8A4C",
  "#7466EE",
  "#D45CF0",
  "#F2C14E",
  "#20BBA8",
  "#FF6F91",
  "#5BC96A",
];

const Row = ({ reverse = false }: { reverse?: boolean }) => (
  <div
    className={`marquee-track gap-3 pe-3 ${reverse ? "marquee-track--reverse" : ""}`}
    aria-hidden={reverse ? true : undefined}
  >
    {[...CAREER_CLUSTERS, ...CAREER_CLUSTERS].map((cluster, index) => {
      const Icon = cluster.icon;
      const tone = TONES[index % CAREER_CLUSTERS.length];
      return (
        <span
          key={`${cluster.label}-${index}`}
          aria-hidden={index >= CAREER_CLUSTERS.length ? true : undefined}
          className="glass-rim glass-rim--day flex shrink-0 items-center gap-2.5 rounded-full px-5 py-2.5 text-sm text-[var(--day-ink-2)]"
        >
          <span style={{ color: tone }} className="flex">
            <Icon size={16} />
          </span>
          {cluster.label}
        </span>
      );
    })}
  </div>
);

/** A compass rose sitting in the bezel's tick, cutting the frame. */
const RoseNotch = ({ className = "" }: { className?: string }) => (
  <span
    className={`absolute left-1/2 -translate-x-1/2 bg-[var(--day-bg)] px-3 ${className}`}
    aria-hidden="true"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#B07A18]">
      <path
        d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  </span>
);

/**
 * The eight clusters framed like a compass bezel, with the band of results
 * running through the headline. Stays on the day surface so the day half has
 * a single dark insert (the comparison), not two.
 */
export const ClusterBand = () => (
  <section
    className="relative overflow-hidden py-20 md:py-24"
    aria-labelledby="clusters-heading"
  >
    <Container>
      <div className="bezel relative rounded-[1.75rem] py-12 sm:py-14">
        <RoseNotch className="-top-[11px]" />
        <RoseNotch className="-bottom-[11px]" />

        <FadeIn className="px-6 text-center sm:px-10">
          <h2
            id="clusters-heading"
            className="font-heading text-3xl font-semibold leading-tight sm:text-4xl"
          >
            Eight places your answers
          </h2>
        </FadeIn>

        {/* Breaks the container so the band runs the full width and crosses
            the frame, rather than stopping politely inside it. */}
        <div className="relative left-1/2 my-7 flex w-screen -translate-x-1/2 flex-col gap-3 overflow-hidden">
          <Row />
          <Row reverse />
        </div>

        <FadeIn className="px-6 text-center sm:px-10">
          <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
            could <GradientText>point you.</GradientText>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[var(--day-ink-2)]">
            Not a job title. A territory worth exploring, with the roles and
            subjects that sit inside it.
          </p>
        </FadeIn>
      </div>
    </Container>
  </section>
);
