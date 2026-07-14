"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { TareeqPause, TareeqPlay } from "@/components/brand/icons";

type State = "idle" | "loading" | "playing";

interface PlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: State;
}

export function PlayButton({
  state = "idle",
  "aria-label": ariaLabel,
  className,
  ...rest
}: PlayButtonProps) {
  const label =
    ariaLabel ?? (state === "playing" ? "Pause question" : "Play question");
  return (
    <button
      type="button"
      className={`tareeq-play ${className ?? ""}`}
      aria-label={label}
      data-state={state}
      {...rest}
    >
      {state === "loading" ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : state === "playing" ? (
        <TareeqPause showAccent={false} />
      ) : (
        <TareeqPlay showAccent={false} />
      )}
    </button>
  );
}

interface SpeedPillProps {
  value: number;
  onChange(next: number): void;
  className?: string;
}

const SPEED_CYCLE: ReadonlyArray<number> = [1, 1.25, 1.5, 0.75];

export function SpeedPill({ value, onChange, className }: SpeedPillProps) {
  function cycle() {
    const idx = SPEED_CYCLE.indexOf(value);
    const next = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length];
    onChange(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={`tareeq-speed-pill ${className ?? ""}`}
      aria-label={`Playback speed ${value}× — tap to change`}
    >
      {value}×
    </button>
  );
}
