import type { CSSProperties } from "react";

const DOT_STYLE = (delayMs: number): CSSProperties => ({
  animation: `kai-signal-breathe 1s ease-in-out ${delayMs}ms infinite`,
});

export function TypingIndicator() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <i className="size-1.5 rounded-full bg-[rgba(43,36,28,0.3)]" style={DOT_STYLE(0)} />
      <i className="size-1.5 rounded-full bg-[rgba(43,36,28,0.3)]" style={DOT_STYLE(150)} />
      <i className="size-1.5 rounded-full bg-[rgba(43,36,28,0.3)]" style={DOT_STYLE(300)} />
    </span>
  );
}
