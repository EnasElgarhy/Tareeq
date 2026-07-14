/**
 * Back-compat shim — the canonical mentor character lives in
 * `components/brand/Kai.tsx`. Re-exported here so legacy imports keep
 * working with no changes.
 */
import { Kai } from "@/components/brand/Kai";

type Mood = "curious" | "warm" | "thinking";

interface CharacterIllustrationProps {
  mood?: Mood;
}

export function CharacterIllustration({
  mood = "curious",
}: CharacterIllustrationProps) {
  return <Kai mood={mood} />;
}
