import { useEffect, useState } from "react";
import {
  COMPASS_PILLARS,
  type CompassPillar,
  type CompassSnapshot,
} from "./pillar-progress";

const DEFAULT_DURATION_MS = 700;

/**
 * Tween a CompassSnapshot toward a new target so the compass arcs grow
 * visibly instead of snapping. Each fill value and the overall percent
 * ease-out from the previous frame to the new target over
 * `durationMs`. The active pillar is not numeric so it snaps.
 *
 * Respects `prefers-reduced-motion` — collapses to an instant change.
 */
export function useAnimatedSnapshot(
  target: CompassSnapshot,
  durationMs: number = DEFAULT_DURATION_MS,
): CompassSnapshot {
  const [current, setCurrent] = useState<CompassSnapshot>(target);

  // Stable key — only re-trigger when fill values actually move.
  const fillKey = COMPASS_PILLARS.map((p) => target.byPillar[p].toFixed(4)).join(
    ",",
  );
  const overallKey = target.overall.toFixed(4);
  const activeKey = target.activePillar ?? "none";

  useEffect(() => {
    if (typeof window === "undefined") {
      setCurrent(target);
      return;
    }

    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCurrent(target);
      return;
    }

    const from = current;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const t = Math.min((now - start) / durationMs, 1);
      // Ease-out cubic — fast start, gentle settle.
      const eased = 1 - Math.pow(1 - t, 3);

      const by: Record<CompassPillar, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const p of COMPASS_PILLARS) {
        const a = from.byPillar[p];
        const b = target.byPillar[p];
        by[p] = a + (b - a) * eased;
      }
      const overall =
        from.overall + (target.overall - from.overall) * eased;

      setCurrent({
        byPillar: by,
        overall,
        activePillar: target.activePillar,
      });

      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillKey, overallKey, activeKey, durationMs]);

  return current;
}
