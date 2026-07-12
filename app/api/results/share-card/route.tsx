import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
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
import { translate, type StringKey } from "@/lib/i18n/strings";
import { isLocale, type Locale } from "@/lib/i18n/locale";
import { clusterCodes, driverCodes, type ArchetypeName } from "@/lib/scoring/types";
import type { EcosystemFitName } from "@/lib/results/types";

export const runtime = "nodejs";

/**
 * Static PNG export of the CompassCard (components/results/CompassCard.tsx)
 * at full 1080×1920 for actual sharing — the on-screen card is a live React
 * component with a real CSS entrance animation + `filter: blur()` aurora
 * glow, neither of which apply here:
 *
 * - Renders the animation's END STATE only (per the design handoff: "For
 *   the exported/shared static image, render the end state").
 * - The aurora glow is approximated with multi-stop radial gradients
 *   instead of `filter: blur()` — Satori (which next/og's ImageResponse
 *   uses) + resvg-js has a longstanding, unresolved bug where blurred
 *   shapes render with dark border artifacts in PNG output specifically
 *   (SVG/HTML output is fine). See:
 *   https://github.com/vercel/satori/issues/573
 *   https://github.com/vercel/satori/issues/309
 *
 * Fonts are static (non-variable) TTF instances self-hosted in
 * app/fonts/share-card/ — Satori doesn't support variable font axis
 * interpolation (needs a distinct file per weight/style actually used on
 * the card) and its PNG rasterizer rejects WOFF2 outright ("Unsupported
 * OpenType signature wOF2"), so these are raw TTF, not the woff2 the rest
 * of the app self-hosts fonts as.
 */

const SCALE = 3; // 360×640 reference → 1080×1920 export
const s = (n: number) => n * SCALE;

const FONT_DIR = join(process.cwd(), "app/fonts/share-card");
const fraunces700 = readFileSync(join(FONT_DIR, "fraunces-normal-700.ttf"));
const fraunces400 = readFileSync(join(FONT_DIR, "fraunces-normal-400.ttf"));
const frauncesItalic600 = readFileSync(join(FONT_DIR, "fraunces-italic-600.ttf"));
const jakarta600 = readFileSync(join(FONT_DIR, "plus-jakarta-sans-600.ttf"));
const jakarta700 = readFileSync(join(FONT_DIR, "plus-jakarta-sans-700.ttf"));
// Arabic text MUST get an explicit Arabic-capable font — leaving Satori to
// dynamically fetch its own fallback for uncovered glyphs (the Latin-only
// fonts above don't have Arabic) hits a fallback font using an OpenType
// GSUB feature Satori's shaper doesn't support ("lookupType: 5 -
// substFormat: 3 is not yet supported"), crashing the whole render.
// IBM Plex Sans Arabic (same family the rest of the app self-hosts,
// re-fetched as TTF for the same reason as the Latin fonts above) renders
// correctly instead — confirmed via isolated repro before landing this.
const ibmPlexArabic400 = readFileSync(join(FONT_DIR, "ibm-plex-arabic-400.ttf"));
const ibmPlexArabic600 = readFileSync(join(FONT_DIR, "ibm-plex-arabic-600.ttf"));
const ibmPlexArabic700 = readFileSync(join(FONT_DIR, "ibm-plex-arabic-700.ttf"));

/** Multi-stop radial gradient standing in for a blurred circle — see the
 *  module comment for why a real blur filter can't be used here. */
function softGlow(hex: string, alpha: number): string {
  const at = (a: number) => rgbaFromHex(hex, a);
  return `radial-gradient(circle, ${at(alpha)} 0%, ${at(alpha * 0.85)} 15%, ${at(alpha * 0.6)} 35%, ${at(alpha * 0.32)} 55%, ${at(alpha * 0.12)} 75%, ${at(0)} 100%)`;
}

function isValidCluster(v: string | null): v is (typeof clusterCodes)[number] {
  return !!v && (clusterCodes as readonly string[]).includes(v);
}
function isValidDriver(v: string | null): v is (typeof driverCodes)[number] {
  return !!v && (driverCodes as readonly string[]).includes(v);
}
const VALID_ARCHETYPES: ArchetypeName[] = [
  "Precisionist",
  "Coordinator",
  "Explorer",
  "Catalyst",
  "Adaptive",
];
const VALID_ECOSYSTEMS: EcosystemFitName[] = [
  "High-Energy Team Player",
  "Structured Team Player",
  "Solo Sprinter",
  "Solo Specialist",
];

function splitAroundPlaceholder(template: string, placeholder: string): [string, string] {
  const [before, after] = template.split(placeholder);
  return [before ?? "", after ?? ""];
}

/** Satori never applies the Unicode bidi algorithm — a multi-word text node
 *  renders its words in literal left-to-right source order regardless of
 *  script. `flexDirection: row-reverse` (used throughout this route) only
 *  reorders *sibling* flex children; it does nothing for multiple words
 *  packed into one span. Reversing the word order up front compensates,
 *  so the single-word-at-a-time left-to-right render lands in correct RTL
 *  reading order. Confirmed via cropped renders of the footer and eyebrow
 *  rows, where multi-word segments rendered in literal source order
 *  instead of right-to-left. Single-word strings are unaffected (no-op). */
function rtlWords(text: string, isArabic: boolean): string {
  return isArabic ? text.split(" ").reverse().join(" ") : text;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const name = (params.get("name") ?? "").trim().slice(0, 40);
  const clusterCode = params.get("cluster");
  const archetype = params.get("archetype");
  const driverCode = params.get("driver");
  const ecosystemFit = params.get("ecosystem");
  const localeParam = params.get("locale");

  if (!name) {
    return Response.json({ error: "Missing required param: name" }, { status: 400 });
  }
  if (!isValidCluster(clusterCode)) {
    return Response.json({ error: "Invalid or missing param: cluster" }, { status: 400 });
  }
  if (!archetype || !VALID_ARCHETYPES.includes(archetype as ArchetypeName)) {
    return Response.json({ error: "Invalid or missing param: archetype" }, { status: 400 });
  }
  if (!isValidDriver(driverCode)) {
    return Response.json({ error: "Invalid or missing param: driver" }, { status: 400 });
  }
  if (!ecosystemFit || !VALID_ECOSYSTEMS.includes(ecosystemFit as EcosystemFitName)) {
    return Response.json({ error: "Invalid or missing param: ecosystem" }, { status: 400 });
  }

  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  const t = (key: StringKey) => translate(locale, key);
  const isArabic = locale === "ar";
  // IBM Plex Sans Arabic has no italic face (same reasoning as the live
  // app's `html.locale-ar .text-grad-warm { font-style: normal }` rule) —
  // Fraunces stays the display font for English; Arabic swaps to the
  // Arabic face entirely and never goes italic.
  const displayFont = isArabic ? "IBM Plex Sans Arabic" : "Fraunces";
  const bodyFont = isArabic ? "IBM Plex Sans Arabic" : "Plus Jakarta Sans";

  const clusterColor = getClusterColor(clusterCode);
  const clusterLabel = rtlWords(getClusterLabel(clusterCode, t), isArabic);
  const archetypeLabel = t(getArchetypeKey(archetype as ArchetypeName));
  const driverLabel = t(getDriverKey(driverCode));
  const ecosystemLabel = rtlWords(
    t(getEcosystemFitKey(ecosystemFit as EcosystemFitName)),
    isArabic,
  );

  const [eyebrowBefore, eyebrowAfterRaw] = splitAroundPlaceholder(
    t("share_card.eyebrow"),
    "{name}",
  );
  const eyebrowAfter = rtlWords(eyebrowAfterRaw, isArabic);
  const [inClusterBefore, inClusterAfter] = splitAroundPlaceholder(
    t("share_card.in_cluster"),
    "{cluster}",
  );
  const [drivenByBefore, drivenByAfter] = splitAroundPlaceholder(
    t("share_card.driven_by"),
    "{driver}",
  );
  const [footerBeforeRaw, footerAfter] = splitAroundPlaceholder(
    t("share_card.footer"),
    "✦",
  );
  const footerBefore = rtlWords(footerBeforeRaw, isArabic);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: s(360),
          height: s(640),
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(170deg, #0E0A28 0%, #1B1240 52%, #3D2270 100%)",
          color: "#fff",
          fontFamily: bodyFont,
        }}
      >
        {/* Aurora glow — gradient-approximated, see module comment. Satori
         *  doesn't fade a radial-gradient to fully transparent at a plain
         *  rectangle's corners the way a browser does, so each blob needs
         *  an explicit circular clip (borderRadius 50%) or the gradient's
         *  corner color shows as a hard-edged box. */}
        <div
          style={{
            position: "absolute",
            left: s(110),
            top: s(224), // 46% of 640 - half of 520, roughly matching the live component's centering
            width: s(260),
            height: s(260),
            borderRadius: "50%",
            display: "flex",
            background: softGlow(clusterColor, 0.38),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: s(220),
            top: s(354),
            width: s(220),
            height: s(220),
            borderRadius: "50%",
            display: "flex",
            background: softGlow("#F4C660", 0.22),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: s(70),
            top: s(384),
            width: s(200),
            height: s(200),
            borderRadius: "50%",
            display: "flex",
            background: softGlow("#6FE0C0", 0.18),
          }}
        />

        {/* Header */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${s(24)}px ${s(26)}px 0`,
          }}
        >
          <div
            style={{
              fontFamily: "Fraunces",
              fontWeight: 700,
              fontSize: s(17),
              letterSpacing: s(0.34),
              display: "flex",
            }}
          >
            tareeq
          </div>
          <div
            style={{
              fontSize: s(9),
              fontWeight: 700,
              letterSpacing: s(2.34),
              color: "rgba(255,255,255,.55)",
              display: "flex",
            }}
          >
            {rtlWords(t("share_card.header_label"), isArabic)}
          </div>
        </div>

        {/* Compass */}
        <div
          style={{
            position: "relative",
            width: s(300),
            height: s(300),
            margin: `${s(30)}px auto 0`,
            display: "flex",
          }}
        >
          <svg
            viewBox="0 0 300 300"
            width={s(300)}
            height={s(300)}
            style={{ position: "absolute", inset: 0 }}
          >
            <circle cx="150" cy="150" r="126" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
            <circle cx="150" cy="150" r="108" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />
            <g stroke="rgba(255,255,255,.28)" strokeWidth="1">
              <line x1="150" y1="18" x2="150" y2="30" />
              <line x1="150" y1="270" x2="150" y2="282" />
              <line x1="18" y1="150" x2="30" y2="150" />
              <line x1="270" y1="150" x2="282" y2="150" />
            </g>
            <g stroke="rgba(255,255,255,.12)" strokeWidth="1">
              <line x1="243" y1="57" x2="235" y2="65" />
              <line x1="57" y1="57" x2="65" y2="65" />
              <line x1="243" y1="243" x2="235" y2="235" />
              <line x1="57" y1="243" x2="65" y2="235" />
            </g>
            <path d="M150 62 L162 138 L150 150 L138 138 Z" fill="#F4C660" opacity=".95" />
            <path d="M150 238 L162 162 L150 150 L138 162 Z" fill="rgba(244,198,96,.28)" />
            <path d="M62 150 L138 138 L150 150 L138 162 Z" fill="rgba(244,198,96,.28)" />
            <path d="M238 150 L162 162 L150 150 L162 138 Z" fill="rgba(244,198,96,.28)" />
            <circle cx="150" cy="150" r="5" fill="#F4C660" />
            <circle cx="150" cy="24" r="4" fill="#F4C660" />
            <circle cx="276" cy="150" r="4" fill="#6FE0C0" />
            <circle cx="150" cy="276" r="4" fill="#F2A8B3" />
            <circle cx="24" cy="150" r="4" fill="#9D7FF0" />
          </svg>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: s(-4),
              transform: `translate(-50%, -100%)`,
              fontSize: s(8.5),
              fontWeight: 700,
              letterSpacing: s(1.87),
              color: "#F4C660",
              display: "flex",
            }}
          >
            {t("share_card.pillar.curiosity")}
          </div>
          {/* Satori has a bug where an outer `translate()` transform
           *  combined with an inner `rotate()` transform silently drops
           *  the element from output entirely — flexbox centering (no
           *  transform on the outer element) sidesteps it; confirmed via
           *  isolated repro before landing this. */}
          <div
            style={{
              position: "absolute",
              right: s(-20),
              top: 0,
              height: s(300),
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                transform: `rotate(90deg)`,
                fontSize: s(8.5),
                fontWeight: 700,
                letterSpacing: s(1.87),
                color: "#6FE0C0",
                display: "flex",
              }}
            >
              {t("share_card.pillar.operations")}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: s(-4),
              transform: `translate(-50%, 100%)`,
              fontSize: s(8.5),
              fontWeight: 700,
              letterSpacing: s(1.87),
              color: "#F2A8B3",
              display: "flex",
            }}
          >
            {t("share_card.pillar.rewards")}
          </div>
          <div
            style={{
              position: "absolute",
              left: s(-20),
              top: 0,
              height: s(300),
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                transform: `rotate(-90deg)`,
                fontSize: s(8.5),
                fontWeight: 700,
                letterSpacing: s(1.87),
                color: "#9D7FF0",
                display: "flex",
              }}
            >
              {t("share_card.pillar.ecosystem")}
            </div>
          </div>
        </div>

        {/* Archetype reveal */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginTop: s(34),
            padding: `0 ${s(30)}px`,
          }}
        >
          <div
            style={{
              fontSize: s(10),
              fontWeight: 600,
              letterSpacing: s(3),
              color: "rgba(255,255,255,.6)",
              display: "flex",
              // display:flex lays each child out as its own flex item, so
              // spacing needs explicit space-only spans rather than relying
              // on whitespace embedded in a string (Satori doesn't render
              // that reliably). Children stay in LOGICAL/reading order;
              // row-reverse flips the VISUAL order for Arabic without
              // having to re-derive which margin side each piece needs.
              flexDirection: isArabic ? "row-reverse" : "row",
            }}
          >
            <span>{eyebrowBefore}</span>
            {eyebrowBefore ? <span>{" "}</span> : null}
            <span>{name.toUpperCase()}</span>
            {/* eyebrowAfter (", YOUR PATH POINTS TO" / "، طريقك...") starts
             *  with punctuation in both locales' templates, so it gets no
             *  leading space. */}
            <span>{eyebrowAfter}</span>
          </div>
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 600,
              fontStyle: isArabic ? "normal" : "italic",
              fontSize: s(44),
              lineHeight: 1.02,
              color: "#F4C660",
              marginTop: s(10),
              display: "flex",
            }}
          >
            {archetypeLabel}
          </div>
          <div
            style={{
              fontFamily: displayFont,
              fontSize: s(19),
              color: "rgba(255,255,255,.9)",
              marginTop: s(8),
              display: "flex",
              flexDirection: isArabic ? "row-reverse" : "row",
            }}
          >
            <span>{inClusterBefore}</span>
            {inClusterBefore ? <span>{" "}</span> : null}
            <span style={{ fontStyle: isArabic ? "normal" : "italic", color: clusterColor }}>
              {clusterLabel}
            </span>
            {inClusterAfter ? <span>{" "}</span> : null}
            <span>{inClusterAfter}</span>
          </div>
        </div>

        {/* Supporting details */}
        <div
          style={{
            position: "absolute",
            left: s(26),
            right: s(26),
            bottom: s(52),
            display: "flex",
            flexDirection: isArabic ? "row-reverse" : "row",
            justifyContent: "center",
            gap: s(22),
            fontSize: s(9.5),
            letterSpacing: s(0.57),
            color: "rgba(255,255,255,.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              gap: s(6),
            }}
          >
            <div
              style={{
                width: s(6),
                height: s(6),
                borderRadius: "50%",
                background: "#F2A8B3",
                display: "flex",
              }}
            />
            <span>{drivenByBefore}</span>
            {drivenByBefore ? <span>{" "}</span> : null}
            <span>{driverLabel}</span>
            <span>{drivenByAfter}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              gap: s(6),
            }}
          >
            <div
              style={{
                width: s(6),
                height: s(6),
                borderRadius: "50%",
                background: "#9D7FF0",
                display: "flex",
              }}
            />
            {ecosystemLabel}
          </div>
        </div>

        {/* Footer — the "✦" in the translated string is rendered as a tiny
         *  SVG shape, not text: it's outside the Latin subset of the
         *  self-hosted fonts, and Satori's dynamic-fallback-font fetch for
         *  uncovered glyphs isn't reliable in this environment (fails with
         *  a 400 and paints a wrong fallback glyph). */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: s(20),
            display: "flex",
            flexDirection: isArabic ? "row-reverse" : "row",
            justifyContent: "center",
            alignItems: "center",
            gap: s(6),
            fontSize: s(9),
            letterSpacing: s(1.8),
            color: "rgba(255,255,255,.4)",
          }}
        >
          <span>{footerBefore}</span>
          <svg width={s(8)} height={s(8)} viewBox="0 0 10 10" style={{ display: "flex" }}>
            <path
              d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z"
              fill="rgba(255,255,255,.4)"
            />
          </svg>
          <span>{footerAfter}</span>
        </div>
      </div>
    ),
    {
      width: s(360),
      height: s(640),
      fonts: [
        { name: "Fraunces", data: fraunces700, weight: 700, style: "normal" },
        { name: "Fraunces", data: fraunces400, weight: 400, style: "normal" },
        { name: "Fraunces", data: frauncesItalic600, weight: 600, style: "italic" },
        { name: "Plus Jakarta Sans", data: jakarta600, weight: 600, style: "normal" },
        { name: "Plus Jakarta Sans", data: jakarta700, weight: 700, style: "normal" },
        { name: "IBM Plex Sans Arabic", data: ibmPlexArabic400, weight: 400, style: "normal" },
        { name: "IBM Plex Sans Arabic", data: ibmPlexArabic600, weight: 600, style: "normal" },
        { name: "IBM Plex Sans Arabic", data: ibmPlexArabic700, weight: 700, style: "normal" },
      ],
    },
  );
}
