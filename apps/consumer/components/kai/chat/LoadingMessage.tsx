import { TypingIndicator } from "@/components/kai/chat/TypingIndicator";

/**
 * Shown while waiting on Gemini. Scaled-up, two-particle version of the
 * `.kai-signal` orb system (see globals.css) — the same organic warm-
 * gradient mark used everywhere else Kai "is," rather than a generic
 * spinner, sized up for this being the one moment a fresh conversation
 * is looking at almost nothing else on screen. Never generic "AI is
 * typing" wording, always Kai-specific ("Kai is thinking...").
 */
export function LoadingMessage({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="kai-writing-avatar" aria-hidden="true">
        <span className="kai-writing-avatar__ring" />
        <span className="kai-writing-avatar__core" />
        <span className="kai-writing-avatar__satellite kai-writing-avatar__satellite--a" />
        <span className="kai-writing-avatar__satellite kai-writing-avatar__satellite--b" />
      </span>
      <div className="flex items-center gap-2 rounded-[16px] rounded-ss-[6px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] px-3.5 py-2.5 shadow-[0_6px_16px_rgba(43,36,28,0.05)]">
        <TypingIndicator />
        <span className="text-[11.5px] font-semibold text-[color:var(--day-ink-3,#675d4e)]">{label}</span>
      </div>
    </div>
  );
}
