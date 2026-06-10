"use client";

import { useState } from "react";
import { DidYouKnow } from "@/components/onboarding/DidYouKnow";
import { INTERSTITIALS } from "@/lib/assessment/interstitials";

/**
 * Internal preview for the Did-You-Know checkpoint screen. Renders the
 * real component with a real interstitial; the CTA cycles to the next
 * fact so every variant (and milestone) can be reviewed without walking
 * through the assessment. Not part of the live flow.
 */
export function DidYouKnowPreview() {
  const [idx, setIdx] = useState(0);
  const interstitial = INTERSTITIALS[idx % INTERSTITIALS.length];

  return (
    <DidYouKnow
      key={interstitial.key}
      interstitial={interstitial}
      totalQuestions={54}
      audioState="idle"
      soundOn
      onReplay={() => {}}
      onToggleSound={() => {}}
      onDismiss={() => setIdx((i) => (i + 1) % INTERSTITIALS.length)}
    />
  );
}
