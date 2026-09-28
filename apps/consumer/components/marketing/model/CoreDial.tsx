"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { PILLARS } from "./modelContent";

const SIZE = 400;
const C = SIZE / 2;
const R_OUTER = 186;
const R_INNER = 118;
const GAP_DEG = 7;
const TICKS = 72;
const CYCLE_MS = 2800;

/** Rounded so server and client serialise identical SVG attributes. */
const round = (n: number) => Math.round(n * 100) / 100;

/** Point on a circle, 0° pointing up and increasing clockwise. */
function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: round(C + r * Math.sin(rad)), y: round(C - r * Math.cos(rad)) };
}

function sectorPath(startDeg: number, endDeg: number) {
  const o0 = polar(R_OUTER, startDeg);
  const o1 = polar(R_OUTER, endDeg);
  const i1 = polar(R_INNER, endDeg);
  const i0 = polar(R_INNER, startDeg);
  return [
    `M${o0.x} ${o0.y}`,
    `A${R_OUTER} ${R_OUTER} 0 0 1 ${o1.x} ${o1.y}`,
    `L${i1.x} ${i1.y}`,
    `A${R_INNER} ${R_INNER} 0 0 0 ${i0.x} ${i0.y}`,
    "Z",
  ].join(" ");
}

/**
 * The CORE compass: four pillars as quadrants of one dial. It cycles on its
 * own to show the model is one whole, and hands control to the visitor on the
 * first hover or focus. Each quadrant links to its chapter below.
 */
export function CoreDial() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [isUserDriven, setIsUserDriven] = useState(false);

  useEffect(() => {
    if (reduce || isUserDriven) return;
    const timer = window.setInterval(
      () => setActive((i) => (i + 1) % PILLARS.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(timer);
  }, [reduce, isUserDriven]);

  const select = (index: number) => {
    setIsUserDriven(true);
    setActive(index);
  };

  const current = PILLARS[active];

  return (
    <figure className="relative mx-auto w-full max-w-[26rem]">
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full opacity-60 blur-3xl transition-colors duration-700"
        style={{ background: `${current.nightAccent}40` }}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative w-full overflow-visible"
        role="group"
        aria-label="The four CORE pillars"
      >
        {Array.from({ length: TICKS }, (_, i) => {
          const deg = (360 / TICKS) * i;
          const isMajor = i % (TICKS / 4) === 0;
          const a = polar(R_OUTER + 8, deg);
          const b = polar(R_OUTER + (isMajor ? 20 : 13), deg);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#F5EEE6"
              strokeOpacity={isMajor ? 0.55 : 0.16}
              strokeWidth={isMajor ? 2 : 1}
              aria-hidden="true"
            />
          );
        })}

        {PILLARS.map((pillar, i) => {
          const mid = i * 90;
          const isActive = i === active;
          const label = polar((R_OUTER + R_INNER) / 2, mid);
          return (
            <a
              key={pillar.id}
              href={`#${pillar.id}`}
              aria-label={`${pillar.name}: ${pillar.question}`}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              className="cursor-pointer outline-none [&:focus-visible>path]:stroke-[#F5EEE6] [&:focus-visible>path]:[stroke-width:2.5]"
            >
              <path
                d={sectorPath(mid - 45 + GAP_DEG / 2, mid + 45 - GAP_DEG / 2)}
                fill={pillar.nightAccent}
                fillOpacity={isActive ? 0.92 : 0.1}
                stroke={pillar.nightAccent}
                strokeOpacity={isActive ? 1 : 0.4}
                strokeWidth={1.25}
                className="transition-[fill-opacity,stroke-opacity] duration-500"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-heading select-none text-[44px] font-bold transition-[fill] duration-500"
                fill={isActive ? "#14101F" : pillar.nightAccent}
              >
                {pillar.letter}
              </text>
            </a>
          );
        })}

        <circle
          cx={C}
          cy={C}
          r={R_INNER - 16}
          fill="#100A24"
          stroke="#F5EEE6"
          strokeOpacity={0.12}
        />
        <motion.g
          style={{ originX: `${C}px`, originY: `${C}px` }}
          animate={{ rotate: active * 90 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 70, damping: 14 }
          }
          aria-hidden="true"
        >
          <path
            d={`M${C} ${C - 84} L${C + 11} ${C} L${C} ${C + 14} L${C - 11} ${C} Z`}
            fill={current.nightAccent}
            className="transition-[fill] duration-500"
          />
          <path
            d={`M${C} ${C + 60} L${C + 8} ${C} L${C - 8} ${C} Z`}
            fill="#F5EEE6"
            fillOpacity={0.22}
          />
        </motion.g>
        <circle cx={C} cy={C} r={7} fill="#F5EEE6" aria-hidden="true" />
      </svg>

      <figcaption className="mt-6 text-center">
        <span
          className="text-xs font-semibold uppercase tracking-[0.22em] transition-colors duration-500"
          style={{ color: current.nightAccent }}
        >
          {current.index} · {current.name}
        </span>
        <span className="font-heading mt-2 block text-xl font-semibold text-[#F5EEE6]">
          {current.question}
        </span>
      </figcaption>
    </figure>
  );
}
