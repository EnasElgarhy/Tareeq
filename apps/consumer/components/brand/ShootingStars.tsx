import styles from "./ShootingStars.module.css";

const DEFAULT_STAR_COUNT = 24;

interface ShootingStarsProps {
  /** How many streaks share the sky; each has its own offset and pace. */
  count?: number;
  className?: string;
}

/**
 * The website's night sky: thin violet streaks that cross the surface on
 * staggered, deterministic timings (no randomness, so server and client
 * render the same). Fills its nearest positioned ancestor, sits behind its
 * siblings, and disappears under prefers-reduced-motion.
 */
export function ShootingStars({
  count = DEFAULT_STAR_COUNT,
  className = "",
}: ShootingStarsProps) {
  return (
    <div aria-hidden="true" className={`${styles.sky} ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={styles.shootingStar}
          style={{
            left: `${(index * 37 + 7) % 100}%`,
            top: `${(index * 17 + 2) % 100}%`,
            animationDelay: `${-((index * 2.3) % 11)}s`,
            animationDuration: `${7 + (index % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}
