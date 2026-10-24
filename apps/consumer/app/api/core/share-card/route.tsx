import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { coreBank, coreWording } from "@/lib/core-v2/content/core-content";
import {
  SHARE_LABELS,
  SHARE_SITE,
  motivatorChip,
  parseShareCardQuery,
  zoneChip,
  type ShareCard,
  type SharePart,
} from "@/lib/core-v2/share";
import { AXIS_CODES, type AxisCode } from "@/lib/core-v2/types";

export const runtime = "nodejs";

/**
 * The CORE share card as a PNG (spec §11): story 1080×1920 or square
 * 1080×1080. The art is one of eight people-free places made with Gemini,
 * chosen by the student's first leading curiosity, so the card stays about
 * the student, not a character. Every word on the card is real
 * text drawn here from the content files, never generated. Only codes come
 * in (lib/core-v2/share.ts checks each one), and no card content is stored.
 *
 * Fonts are static TTF (Satori rejects WOFF2 and variable axes); Arabic gets
 * IBM Plex Sans Arabic explicitly, as in app/api/results/share-card.
 */

const FONT_DIR = join(process.cwd(), "app/fonts/share-card");
const FONTS = [
  { name: "Jakarta", file: "plus-jakarta-sans-600.ttf", weight: 600 as const },
  { name: "Jakarta", file: "plus-jakarta-sans-700.ttf", weight: 700 as const },
  { name: "Plex Arabic", file: "ibm-plex-arabic-400.ttf", weight: 400 as const },
  { name: "Plex Arabic", file: "ibm-plex-arabic-600.ttf", weight: 600 as const },
  { name: "Plex Arabic", file: "ibm-plex-arabic-700.ttf", weight: 700 as const },
].map(({ name, file, weight }) => ({
  name,
  data: readFileSync(join(FONT_DIR, file)),
  weight,
  style: "normal" as const,
}));

const SCENE_DIR = join(process.cwd(), "public/report/share");
const sceneCache = new Map<string, string>();

function scene(code: string): string {
  const cached = sceneCache.get(code);
  if (cached) return cached;
  const data = readFileSync(join(SCENE_DIR, `share-${code}-v3.jpg`)).toString("base64");
  const uri = `data:image/jpeg;base64,${data}`;
  sceneCache.set(code, uri);
  return uri;
}

const NIGHT = "#08051A";
const GOLD = "#F4C660";
const LILAC = "#D9CDF7";
const SIZES = { story: { width: 1080, height: 1920 }, square: { width: 1080, height: 1080 } };

/**
 * Satori draws a text node's words left to right whatever the script, so
 * Arabic phrases are reversed word by word and laid out right-aligned
 * (see app/api/results/share-card for the original finding).
 */
function words(text: string, isArabic: boolean): string {
  return isArabic ? text.split(" ").reverse().join(" ") : text;
}

interface Copy {
  isArabic: boolean;
  t: (typeof SHARE_LABELS)["en"];
}

function Label({ text, copy, size }: { text: string; copy: Copy; size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 600, color: GOLD }}>
      {words(text, copy.isArabic)}
    </div>
  );
}

function Chips({ items, copy, size }: { items: string[]; copy: Copy; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: Math.round(size * 0.45),
        flexDirection: copy.isArabic ? "row-reverse" : "row",
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.75)}px`,
            borderRadius: 999,
            border: "2px solid rgba(217, 205, 247, 0.38)",
            background: "rgba(255, 255, 255, 0.06)",
            fontSize: size,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          {words(item, copy.isArabic)}
        </div>
      ))}
    </div>
  );
}

function Block({ children, copy, gap }: { children: ReactNode; copy: Copy; gap: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: copy.isArabic ? "flex-end" : "flex-start",
        gap,
      }}
    >
      {children}
    </div>
  );
}

function shown(card: ShareCard, part: SharePart): boolean {
  return !card.hidden.includes(part);
}

interface CardParts {
  curiosities: ReactNode | null;
  lead: ReactNode | null;
  chips: ReactNode[];
}

function cardParts(card: ShareCard, copy: Copy, scale: number): CardParts {
  const { locale } = card;
  const bank = coreBank(locale);
  const family = card.familyId ? bank.families.find((f) => f.id === card.familyId) : undefined;
  const jobs = family
    ? card.jobIds
        .map((id) => family.jobs.find((job) => job.id === id)?.name)
        .filter((name): name is string => Boolean(name))
    : [];
  const axisChips = (axes: AxisCode[]) => axes.map((axis) => zoneChip(locale, axis, card.zones[axis]));
  const label = Math.round(26 * scale);
  const chip = Math.round(28 * scale);
  const align = copy.isArabic ? "flex-end" : "flex-start";

  const curiosities = shown(card, "curiosities") ? (
    <Block copy={copy} gap={Math.round(16 * scale)}>
      <Label text={copy.t.curiosities} copy={copy} size={label} />
      {card.curiosities.map((code) => (
        <div key={code} style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 4 }}>
          <div style={{ display: "flex", fontSize: Math.round(48 * scale), fontWeight: 700, lineHeight: 1.08 }}>
            {words(coreWording(locale, `CUR-${code}-NAME`) ?? code, copy.isArabic)}
          </div>
          <div style={{ display: "flex", fontSize: Math.round(27 * scale), color: LILAC }}>
            {words(coreWording(locale, `CUR-${code}-PULL`) ?? "", copy.isArabic)}
          </div>
        </div>
      ))}
    </Block>
  ) : null;

  const lead =
    shown(card, "lead") && family ? (
      <Block copy={copy} gap={Math.round(16 * scale)}>
        <Label text={copy.t.lead} copy={copy} size={label} />
        <div style={{ display: "flex", fontSize: Math.round(40 * scale), fontWeight: 700, lineHeight: 1.1 }}>
          {words(family.name, copy.isArabic)}
        </div>
        {jobs.length > 0 ? <Chips items={jobs} copy={copy} size={chip} /> : null}
      </Block>
    ) : null;

  const rows: { part: SharePart; title: string; items: string[] }[] = [
    { part: "work", title: copy.t.work, items: axisChips(["structure", "focus"]) },
    { part: "setting", title: copy.t.setting, items: axisChips(["team", "setting"]) },
    {
      part: "motivators",
      title: copy.t.motivators,
      items: card.motivators.map((code) => motivatorChip(locale, code)),
    },
  ];
  const chips = rows
    .filter((row) => shown(card, row.part) && row.items.length > 0)
    .map((row) => (
      <Block key={row.part} copy={copy} gap={Math.round(14 * scale)}>
        <Label text={row.title} copy={copy} size={label} />
        <Chips items={row.items} copy={copy} size={chip} />
      </Block>
    ));
  return { curiosities, lead, chips };
}

function Footer({ copy, scale }: { copy: Copy; scale: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: copy.isArabic ? "row-reverse" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: Math.round(26 * scale),
        borderTop: "2px solid rgba(217, 205, 247, 0.2)",
      }}
    >
      <div style={{ display: "flex", fontSize: Math.round(38 * scale), fontWeight: 700, letterSpacing: -0.5 }}>
        Tareeq
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: copy.isArabic ? "row-reverse" : "row",
          gap: Math.round(12 * scale),
          fontSize: Math.round(28 * scale),
          fontWeight: 600,
        }}
      >
        <span style={{ color: LILAC }}>{words(copy.t.find, copy.isArabic)}</span>
        <span style={{ color: GOLD }}>{SHARE_SITE}</span>
      </div>
    </div>
  );
}

function Heading({ card, copy, scale }: { card: ShareCard; copy: Copy; scale: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: copy.isArabic ? "flex-end" : "flex-start", gap: 8 }}>
      {card.firstName ? (
        <div style={{ display: "flex", fontSize: Math.round(30 * scale), fontWeight: 600, color: GOLD }}>
          {card.firstName}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          fontSize: Math.round(92 * scale),
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: copy.isArabic ? 0 : -2,
        }}
      >
        {words(copy.t.title, copy.isArabic)}
      </div>
      <div style={{ display: "flex", fontSize: Math.round(30 * scale), color: LILAC }}>
        {words(copy.t.subtitle, copy.isArabic)}
      </div>
    </div>
  );
}

/** Story: the place as a band across the top, the student's results below. */
function Story({ card, copy }: { card: ShareCard; copy: Copy }) {
  const parts = cardParts(card, copy, 1);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scene(card.curiosities[0])}
        alt=""
        width={1352}
        height={755}
        style={{ position: "absolute", top: 0, left: -136 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: `linear-gradient(180deg, rgba(8,5,26,0.62) 0%, rgba(8,5,26,0.1) 18%, rgba(8,5,26,0.1) 26%, rgba(8,5,26,0.85) 34%, ${NIGHT} 40%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 1080,
          height: 1920,
          padding: "88px 76px 70px",
        }}
      >
        <Heading card={card} copy={copy} scale={1} />
        <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
          {parts.curiosities}
          {parts.lead}
          {parts.chips}
          <Footer copy={copy} scale={1} />
        </div>
      </div>
    </>
  );
}

/** Square: heading beside the place, then results in two columns. */
function Square({ card, copy }: { card: ShareCard; copy: Copy }) {
  const scale = 0.78;
  const parts = cardParts(card, copy, scale);
  const row = copy.isArabic ? "row-reverse" : "row";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 1080,
        height: 1080,
        padding: "60px 64px 52px",
      }}
    >
      <div style={{ display: "flex", flexDirection: row, justifyContent: "space-between", alignItems: "center", gap: 40 }}>
        <Heading card={card} copy={copy} scale={scale} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene(card.curiosities[0])}
          alt=""
          width={440}
          height={246}
          style={{ borderRadius: 28, objectFit: "cover" }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: row, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34, width: 480 }}>
          {parts.curiosities}
          {parts.lead}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, width: 424 }}>{parts.chips}</div>
      </div>
      <Footer copy={copy} scale={scale} />
    </div>
  );
}

export async function GET(request: Request) {
  const card = parseShareCardQuery(new URL(request.url).searchParams, coreBank);
  if (!card) return Response.json({ error: "Invalid card." }, { status: 400 });

  const copy: Copy = { isArabic: card.locale === "ar", t: SHARE_LABELS[card.locale] };
  const { width, height } = SIZES[card.format];

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width,
          height,
          display: "flex",
          background: `radial-gradient(ellipse 80% 50% at 85% 0%, #221248 0%, ${NIGHT} 70%)`,
          color: "#FFFFFF",
          fontFamily: copy.isArabic ? "Plex Arabic" : "Jakarta",
        }}
      >
        {card.format === "story" ? <Story card={card} copy={copy} /> : <Square card={card} copy={copy} />}
      </div>
    ),
    {
      width,
      height,
      fonts: FONTS,
      headers: { "Cache-Control": "private, max-age=3600" },
    },
  );
}
