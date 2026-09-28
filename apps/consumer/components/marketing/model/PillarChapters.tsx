import { Container } from "../Shared";
import { Chapter } from "./Chapter";
import { CuriositiesVisual } from "./CuriositiesVisual";
import { EcosystemSpectrums } from "./EcosystemSpectrums";
import { PILLARS } from "./modelContent";
import { OperationsMatrix } from "./OperationsMatrix";
import { RewardsVisual } from "./RewardsVisual";

const VISUALS = [
  CuriositiesVisual,
  OperationsMatrix,
  RewardsVisual,
  EcosystemSpectrums,
] as const;

export function PillarChapters() {
  return (
    <Container className="divide-y divide-[var(--day-line)] pt-12 lg:pt-20">
      {PILLARS.map((pillar, i) => {
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
