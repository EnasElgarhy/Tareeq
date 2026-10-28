"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "../Shared";
import { Chapter } from "./Chapter";
import { CuriositiesVisual } from "./CuriositiesVisual";
import { EcosystemSpectrums } from "./EcosystemSpectrums";
import { modelCopy } from "./modelContent";
import { OperatingBars } from "./OperatingBars";
import { RewardsVisual } from "./RewardsVisual";

const VISUALS = [
  CuriositiesVisual,
  OperatingBars,
  RewardsVisual,
  EcosystemSpectrums,
] as const;

export function PillarChapters() {
  const { locale } = useLocale();
  return (
    <Container className="divide-y divide-[var(--day-line)] pt-12 lg:pt-20">
      {modelCopy(locale).pillars.map((pillar, i) => {
        const Visual = VISUALS[i];
        return (
          <Chapter key={pillar.id} pillar={pillar} isFlipped={i % 2 === 1}>
            <Visual />
          </Chapter>
        );
      })}
    </Container>
  );
}
