"use client";

import { motion } from "framer-motion";

interface KaiOrbProps {
  size?: number;
  aura?: boolean;
  speed?: number;
  className?: string;
}

/**
 * Kai’s visual identity — a living aurora orb.
 * Layered: rotating conic aura → gradient sphere → drifting inner light → specular highlight.
 * `size` in px. `aura` toggles the outer glow (disable for tiny instances).
 */
export function KaiOrb({
  size = 48,
  aura = true,
  speed = 14,
  className = "",
}: KaiOrbProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {aura && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-[22%] rounded-full opacity-80"
          style={{
            background:
              "conic-gradient(from 0deg, #6E48E4, #F2A8B3, #F4C660, #6FE0C0, #9D7FF0, #6E48E4)",
            filter: `blur(${Math.max(6, size * 0.16)}px)`,
          }}
        />
      )}

      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 120% at 30% 20%, #FDE7A8 0%, #F2A8B3 30%, #9D7FF0 58%, #221248 92%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.25), inset 0 -8% 24% rgba(8,5,26,0.4)",
        }}
      >
        {/* drifting inner light */}
        <motion.div
          animate={{ x: ["-12%", "18%", "-12%"], y: ["8%", "-14%", "8%"] }}
          transition={{
            duration: speed * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/4 top-1/3 w-3/4 h-3/4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(244,198,96,0.9), transparent 65%)",
            filter: "blur(6px)",
          }}
        />
        <motion.div
          animate={{ x: ["10%", "-16%", "10%"], y: ["-6%", "12%", "-6%"] }}
          transition={{
            duration: speed * 0.9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-1/4 bottom-1/4 w-2/3 h-2/3 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(110,72,228,0.8), transparent 65%)",
            filter: "blur(6px)",
          }}
        />
        {/* specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "8%",
            left: "14%",
            width: "42%",
            height: "30%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      </div>
    </div>
  );
}
