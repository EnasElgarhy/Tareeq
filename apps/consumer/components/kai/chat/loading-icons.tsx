import type { CSSProperties } from "react";

/**
 * Small (16px) animated line-icons that pair with each progressive Kai
 * loading status. Line-only, stroke = currentColor (the violet accent),
 * calm compositor-friendly motion defined in globals.css (`kai-load-*`).
 * Each icon is decorative — the adjacent status text carries the meaning.
 */

export type LoadingIconId =
  | "think"
  | "compass"
  | "assemble"
  | "steps"
  | "people"
  | "chat"
  | "search"
  | "sparkle";

const SVG = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** Three dots breathing in sequence — the base "thinking" mark. */
function Think() {
  return (
    <svg {...SVG} aria-hidden="true">
      <circle className="kai-load-pulse" style={delay(0)} cx="3.5" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <circle className="kai-load-pulse" style={delay(160)} cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <circle className="kai-load-pulse" style={delay(320)} cx="12.5" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Compass ring with a slowly rotating needle — "connecting to your Compass". */
function Compass() {
  return (
    <svg {...SVG} aria-hidden="true">
      <circle cx="8" cy="8" r="6" opacity="0.45" />
      <g className="kai-load-rotate">
        <path d="M8 4.2 L9.5 8 L8 11.8 L6.5 8 Z" fill="currentColor" stroke="none" />
      </g>
      <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Three lines fading in sequence — "preparing / drafting / organizing". */
function Assemble() {
  return (
    <svg {...SVG} aria-hidden="true">
      <line className="kai-load-seq" style={delay(0)} x1="3" y1="4.5" x2="13" y2="4.5" />
      <line className="kai-load-seq" style={delay(200)} x1="3" y1="8" x2="11" y2="8" />
      <line className="kai-load-seq" style={delay(400)} x1="3" y1="11.5" x2="12.5" y2="11.5" />
    </svg>
  );
}

/** Three rising bars — "building your next steps". */
function Steps() {
  return (
    <svg {...SVG} aria-hidden="true">
      <line className="kai-load-rise" style={delay(0)} x1="4" y1="13" x2="4" y2="8" />
      <line className="kai-load-rise" style={delay(180)} x1="8" y1="13" x2="8" y2="5.5" />
      <line className="kai-load-rise" style={delay(360)} x1="12" y1="13" x2="12" y2="3.5" />
    </svg>
  );
}

/** Two heads gently bobbing — "your parents' perspective". */
function People() {
  return (
    <svg {...SVG} aria-hidden="true">
      <g className="kai-load-bob" style={delay(0)}>
        <circle cx="5" cy="6" r="1.6" />
        <path d="M2.4 12.5c0-1.7 1.2-3 2.6-3s2.6 1.3 2.6 3" />
      </g>
      <g className="kai-load-bob" style={delay(300)}>
        <circle cx="11" cy="6" r="1.6" />
        <path d="M8.4 12.5c0-1.7 1.2-3 2.6-3s2.6 1.3 2.6 3" />
      </g>
    </svg>
  );
}

/** A speech bubble pulsing — "preparing talking points". */
function Chat() {
  return (
    <svg {...SVG} aria-hidden="true">
      <g className="kai-load-pulse">
        <path d="M3 4.5h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H7l-3 2.2V10.5H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
      </g>
    </svg>
  );
}

/** A magnifier sweeping — "looking for examples". */
function Search() {
  return (
    <svg {...SVG} aria-hidden="true">
      <g className="kai-load-sweep">
        <circle cx="7" cy="7" r="4" />
        <line x1="10" y1="10" x2="13.5" y2="13.5" />
      </g>
    </svg>
  );
}

/** Twinkling stars — "gathering / selecting what fits you". */
function Sparkle() {
  return (
    <svg {...SVG} aria-hidden="true">
      <g className="kai-load-twinkle" style={delay(0)}>
        <path d="M8 2.5c.3 2.4 1.1 3.2 3.5 3.5-2.4.3-3.2 1.1-3.5 3.5-.3-2.4-1.1-3.2-3.5-3.5C6.9 5.7 7.7 4.9 8 2.5Z" fill="currentColor" stroke="none" />
      </g>
      <g className="kai-load-twinkle" style={delay(500)}>
        <path d="M12.5 9.5c.15 1.2.55 1.6 1.75 1.75-1.2.15-1.6.55-1.75 1.75-.15-1.2-.55-1.6-1.75-1.75 1.2-.15 1.6-.55 1.75-1.75Z" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

const ICONS: Record<LoadingIconId, () => React.ReactElement> = {
  think: Think,
  compass: Compass,
  assemble: Assemble,
  steps: Steps,
  people: People,
  chat: Chat,
  search: Search,
  sparkle: Sparkle,
};

export function LoadingIcon({ id }: { id: LoadingIconId }) {
  const Icon = ICONS[id];
  return (
    <span className="kai-load-ico grid size-4 place-items-center">
      <Icon />
    </span>
  );
}
