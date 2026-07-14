"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  getClusterColor,
  getClusterLabel,
  rgbaFromHex,
} from "@/lib/results/cluster-visuals";
import {
  getArchetypeKey,
  getDriverKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { EcosystemFitName } from "@/lib/results/types";
import type { ArchetypeName, ClusterCode, DriverCode } from "@/lib/scoring/types";

export interface CompassCardResult {
  name: string;
  clusterCode: ClusterCode;
  archetype: ArchetypeName;
  driverCode: DriverCode;
  ecosystemFit: EcosystemFitName;
}

/** Splits a `t()` template around a literal placeholder so the value can get
 *  its own styling — same pattern as SharedResultScreen's splitAroundName. */
function splitAroundPlaceholder(
  template: string,
  placeholder: string,
): [string, string] {
  const [before, after] = template.split(placeholder);
  return [before ?? "", after ?? ""];
}

/**
 * "Compass Constellation" shareable result card — design direction 1a
 * ("True North") from the Claude Design handoff. A pure function of one
 * result object; no data fetching, no interactivity. Renders the full
 * entrance animation on mount — for the static PNG export, see
 * app/api/results/share-card/route.ts, which renders the same visual at
 * its end state (no animation) using layered gradients instead of
 * `filter: blur()` for the aurora glow (Satori + resvg-js has a longstanding
 * unresolved bug that corrupts blurred PNG output — see that route's
 * comment for the GitHub issue links).
 *
 * Reference size 360×640 (matches the design handoff 1:1) — the parent
 * controls final display size via `className`/CSS scale, same as the
 * IntroScreen/AssessmentStart hero patterns.
 */
export function CompassCard({ result }: { result: CompassCardResult }) {
  const { t } = useLocale();
  const { name, clusterCode, archetype, driverCode, ecosystemFit } = result;

  const clusterColor = getClusterColor(clusterCode);
  const clusterLabel = getClusterLabel(clusterCode, t);
  const archetypeLabel = t(getArchetypeKey(archetype));
  const driverLabel = t(getDriverKey(driverCode));
  const ecosystemLabel = t(getEcosystemFitKey(ecosystemFit));

  const [eyebrowBefore, eyebrowAfter] = splitAroundPlaceholder(
    t("share_card.eyebrow"),
    "{name}",
  );
  const [inClusterBefore, inClusterAfter] = splitAroundPlaceholder(
    t("share_card.in_cluster"),
    "{cluster}",
  );
  const [drivenByBefore, drivenByAfter] = splitAroundPlaceholder(
    t("share_card.driven_by"),
    "{driver}",
  );

  return (
    <div
      className="compass-card"
      style={{
        position: "relative",
        width: 360,
        height: 640,
        background:
          "linear-gradient(170deg, #0E0A28 0%, #1B1240 52%, #3D2270 100%)",
        overflow: "hidden",
        color: "#fff",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Aurora glow — dominant blob tinted by the result's curiosity
       *  cluster (Tareeq's real 8-color cluster system, not the handoff's
       *  reduced 3-accent placeholder), the other two stay fixed. */}
      <div
        aria-hidden="true"
        className="compass-card-aurora"
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: 520,
          height: 520,
          margin: "-260px 0 0 -260px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 70,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${rgbaFromHex(clusterColor, 0.38)}, transparent 70%)`,
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 220,
            top: 200,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,198,96,.22), transparent 70%)",
            filter: "blur(34px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 230,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(111,224,192,.18), transparent 70%)",
            filter: "blur(34px)",
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 26px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.02em",
          }}
        >
          tareeq
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.26em",
            color: "rgba(255,255,255,.55)",
          }}
        >
          {t("share_card.header_label")}
        </div>
      </div>

      {/* Compass */}
      <div style={{ position: "relative", width: 300, height: 300, margin: "30px auto 0" }}>
        <svg
          viewBox="0 0 300 300"
          width={300}
          height={300}
          style={{ position: "absolute", inset: 0 }}
        >
          <circle
            cx="150"
            cy="150"
            r="126"
            fill="none"
            stroke="rgba(255,255,255,.14)"
            strokeWidth="1"
            strokeDasharray="800"
            className="compass-card-ring-outer"
          />
          <circle
            cx="150"
            cy="150"
            r="108"
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="1"
            strokeDasharray="800"
            className="compass-card-ring-inner"
          />
          <g stroke="rgba(255,255,255,.28)" strokeWidth="1" className="compass-card-ticks-cardinal">
            <line x1="150" y1="18" x2="150" y2="30" />
            <line x1="150" y1="270" x2="150" y2="282" />
            <line x1="18" y1="150" x2="30" y2="150" />
            <line x1="270" y1="150" x2="282" y2="150" />
          </g>
          <g stroke="rgba(255,255,255,.12)" strokeWidth="1" className="compass-card-ticks-diagonal">
            <line x1="243" y1="57" x2="235" y2="65" />
            <line x1="57" y1="57" x2="65" y2="65" />
            <line x1="243" y1="243" x2="235" y2="235" />
            <line x1="57" y1="243" x2="65" y2="235" />
          </g>
          <g
            style={{ transformBox: "view-box", transformOrigin: "150px 150px" }}
            className="compass-card-rose"
          >
            <path d="M150 62 L162 138 L150 150 L138 138 Z" fill="#F4C660" opacity=".95" />
            <path d="M150 238 L162 162 L150 150 L138 162 Z" fill="rgba(244,198,96,.28)" />
            <path d="M62 150 L138 138 L150 150 L138 162 Z" fill="rgba(244,198,96,.28)" />
            <path d="M238 150 L162 162 L150 150 L162 138 Z" fill="rgba(244,198,96,.28)" />
            <circle cx="150" cy="150" r="5" fill="#F4C660" />
          </g>
          <circle
            cx="150"
            cy="24"
            r="4"
            fill="#F4C660"
            style={{ transformBox: "view-box", transformOrigin: "150px 24px" }}
            className="compass-card-dot compass-card-dot-1"
          />
          <circle
            cx="276"
            cy="150"
            r="4"
            fill="#6FE0C0"
            style={{ transformBox: "view-box", transformOrigin: "276px 150px" }}
            className="compass-card-dot compass-card-dot-2"
          />
          <circle
            cx="150"
            cy="276"
            r="4"
            fill="#F2A8B3"
            style={{ transformBox: "view-box", transformOrigin: "150px 276px" }}
            className="compass-card-dot compass-card-dot-3"
          />
          <circle
            cx="24"
            cy="150"
            r="4"
            fill="#9D7FF0"
            style={{ transformBox: "view-box", transformOrigin: "24px 150px" }}
            className="compass-card-dot compass-card-dot-4"
          />
        </svg>
        <div
          className="compass-card-label compass-card-label-1"
          style={{
            position: "absolute",
            left: "50%",
            top: -4,
            transform: "translate(-50%, -100%)",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#F4C660",
            textShadow: "0 0 12px rgba(244,198,96,.8)",
          }}
        >
          {t("share_card.pillar.curiosity")}
        </div>
        <div
          className="compass-card-label compass-card-label-2"
          style={{
            position: "absolute",
            right: -8,
            top: "50%",
            transform: "translate(100%, -50%)",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#6FE0C0",
            writingMode: "vertical-rl",
          }}
        >
          {t("share_card.pillar.operations")}
        </div>
        <div
          className="compass-card-label compass-card-label-3"
          style={{
            position: "absolute",
            left: "50%",
            bottom: -4,
            transform: "translate(-50%, 100%)",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#F2A8B3",
          }}
        >
          {t("share_card.pillar.rewards")}
        </div>
        <div
          className="compass-card-label compass-card-label-4"
          style={{
            position: "absolute",
            left: -8,
            top: "50%",
            transform: "translate(-100%, -50%) rotate(180deg)",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#9D7FF0",
            writingMode: "vertical-rl",
          }}
        >
          {t("share_card.pillar.ecosystem")}
        </div>
      </div>

      {/* Archetype reveal */}
      <div
        style={{ position: "relative", textAlign: "center", marginTop: 34, padding: "0 30px" }}
      >
        <div
          className="compass-card-eyebrow"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,.6)",
          }}
        >
          {eyebrowBefore}
          {name.toUpperCase()}
          {eyebrowAfter}
        </div>
        <div
          className="compass-card-archetype"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontStyle: "italic",
            fontSize: 44,
            lineHeight: 1.02,
            color: "#F4C660",
            marginTop: 10,
            textWrap: "balance",
          }}
        >
          {archetypeLabel}
        </div>
        <div
          className="compass-card-cluster-line"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 19,
            color: "rgba(255,255,255,.9)",
            marginTop: 8,
          }}
        >
          {inClusterBefore}
          <span style={{ fontStyle: "italic", color: clusterColor }}>{clusterLabel}</span>
          {inClusterAfter}
        </div>
      </div>

      {/* Supporting details */}
      <div
        className="compass-card-details"
        style={{
          position: "absolute",
          left: 26,
          right: 26,
          bottom: 52,
          display: "flex",
          justifyContent: "center",
          gap: 22,
          fontSize: 9.5,
          letterSpacing: "0.06em",
          color: "rgba(255,255,255,.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#F2A8B3",
              display: "inline-block",
            }}
          />
          {drivenByBefore}
          {driverLabel}
          {drivenByAfter}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#9D7FF0",
              display: "inline-block",
            }}
          />
          {ecosystemLabel}
        </div>
      </div>

      {/* Footer */}
      <div
        className="compass-card-footer"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 20,
          textAlign: "center",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,.4)",
        }}
      >
        {t("share_card.footer")}
      </div>
    </div>
  );
}
