import type { Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/strings";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import {
  getArchetypeKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

export type ResultDocumentVariant = "full" | "parent";
export type ResultDocumentOpenMethod = "print" | "download";

interface BuildResultDocumentOptions {
  report: PersonalizedCompassReport;
  name: string;
  locale: Locale;
  variant: ResultDocumentVariant;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraph(value: string): string {
  return `<p>${escapeHtml(value)}</p>`;
}

function itemList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function section(title: string, body: string): string {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>
  `;
}

function safeDate(value: string, locale: Locale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function documentStyles(accent: string): string {
  return `
    :root {
      color-scheme: light;
      --accent: ${accent};
      --ink: #23183d;
      --muted: #675f72;
      --paper: #fffdf8;
      --wash: #f5f0e8;
      --line: #ded6ca;
    }
    * { box-sizing: border-box; }
    html {
      background: #ece6dc;
      font-feature-settings: "kern" 1, "liga" 1;
      text-rendering: optimizeLegibility;
    }
    body {
      margin: 0;
      color: var(--ink);
      background: #ece6dc;
      font-family: "Plus Jakarta Sans", "IBM Plex Sans Arabic", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.55;
    }
    .sheet {
      width: min(100% - 32px, 820px);
      margin: 32px auto;
      padding: 48px;
      background: var(--paper);
      border: 1px solid var(--line);
    }
    header {
      padding-bottom: 28px;
      border-bottom: 3px solid var(--accent);
    }
    .brand {
      margin: 0 0 24px;
      color: #6b4bd3;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: lowercase;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 19ch;
      margin: 0;
      font-family: Georgia, "IBM Plex Sans Arabic", serif;
      font-size: 36px;
      line-height: 1.08;
      letter-spacing: 0;
    }
    .subtitle {
      max-width: 62ch;
      margin: 14px 0 0;
      color: var(--muted);
      font-size: 16px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 24px 0 8px;
    }
    .fact {
      min-width: 0;
      padding: 14px;
      background: var(--wash);
      border-inline-start: 3px solid var(--accent);
    }
    .fact span {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .fact strong {
      display: block;
      font-size: 15px;
      overflow-wrap: anywhere;
    }
    section {
      padding: 24px 0;
      border-bottom: 1px solid var(--line);
      break-inside: avoid;
    }
    h2 {
      margin: 0 0 10px;
      font-family: Georgia, "IBM Plex Sans Arabic", serif;
      font-size: 21px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    p { margin: 0; white-space: pre-line; }
    ul {
      margin: 0;
      padding-inline-start: 22px;
    }
    li + li { margin-top: 7px; }
    .note {
      margin-top: 24px;
      padding: 16px;
      color: var(--muted);
      background: var(--wash);
      border: 1px solid var(--line);
      font-size: 13px;
    }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 24px;
      color: var(--muted);
      font-size: 11px;
    }
    @media (max-width: 620px) {
      .sheet {
        width: 100%;
        margin: 0;
        padding: 28px 22px;
        border: 0;
      }
      h1 { font-size: 30px; }
      .facts { grid-template-columns: 1fr; }
    }
    @page { size: A4; margin: 14mm; }
    @media print {
      html, body { background: #fff; }
      .sheet {
        width: 100%;
        margin: 0;
        padding: 0;
        border: 0;
      }
      header { break-after: avoid; }
      section { break-inside: avoid; }
    }
  `;
}

export function buildResultDocument({
  report,
  name,
  locale,
  variant,
}: BuildResultDocumentOptions): string {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const isParent = variant === "parent";
  const titleTemplate = isParent
    ? t("results.parent.title")
    : t("results.export.title");
  const title = titleTemplate.replace("{name}", name);
  const subtitle = isParent
    ? t("results.parent.intro")
    : t("results.export.subtitle");
  const cluster = getClusterLabel(report.clusterCode, t);
  const style = t(getArchetypeKey(report.archetype));
  const environment = t(getEcosystemFitKey(report.ecosystemFit));
  const accent = "#6b4bd3";
  const generatedDate = safeDate(report.generatedAt, locale);

  const facts = [
    [t("results.parent.cluster"), cluster],
    [t("results.parent.style"), style],
    [t("results.parent.motivation"), report.primaryDriver],
    [t("results.parent.environment"), environment],
  ]
    .map(
      ([label, value]) =>
        `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`,
    )
    .join("");

  const fullSections = [
    section(t("results.export.summary_title"), paragraph(report.summary)),
    section(
      t("results.career.title"),
      itemList(report.careerExamples.slice(0, 6)),
    ),
    section(
      t("results.majors.title"),
      itemList(report.universityMajors.slice(0, 6)),
    ),
    section(
      t("results.subjects.title"),
      itemList(report.highSchoolSubjects.slice(0, 6)),
    ),
    section(
      t("results.section.landscape_title"),
      paragraph(report.careerLandscape),
    ),
    section(
      t("results.section.academic_title"),
      paragraph(report.academicPath),
    ),
    section(
      t("results.section.non_obvious_title"),
      itemList(report.nonObviousPaths.slice(0, 8)),
    ),
    section(t("results.section.reality_title"), paragraph(report.realityCheck)),
    section(
      t("results.section.integration_title"),
      paragraph(report.integration),
    ),
    section(t("results.section.next_steps_title"), paragraph(report.nextSteps)),
  ].join("");

  const parentSections = [
    section(t("results.parent.noticed_title"), paragraph(report.summary)),
    section(
      t("results.parent.paths_title"),
      paragraph(t("results.parent.paths_intro")) +
        itemList([
          ...report.careerExamples.slice(0, 4),
          ...report.universityMajors.slice(0, 3),
        ]),
    ),
    section(
      t("results.parent.support_title"),
      itemList([
        t("results.parent.support_interest"),
        t("results.parent.support_experiment"),
        t("results.parent.support_action"),
      ]),
    ),
    section(
      t("results.parent.questions_title"),
      itemList([
        t("results.parent.question_one"),
        t("results.parent.question_two"),
        t("results.parent.question_three"),
      ]),
    ),
    section(t("results.parent.next_step_title"), paragraph(report.nextSteps)),
  ].join("");

  return `<!doctype html>
<html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${documentStyles(accent)}</style>
  </head>
  <body>
    <main class="sheet">
      <header>
        <p class="brand">tareeq</p>
        <p class="eyebrow">${escapeHtml(
          isParent ? t("results.parent.eyebrow") : t("results.hero.eyebrow"),
        )}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
      </header>
      <div class="facts">${facts}</div>
      ${isParent ? parentSections : fullSections}
      <p class="note">${escapeHtml(
        isParent ? t("results.parent.note") : t("results.export.note"),
      )}</p>
      <footer>
        <span>${escapeHtml(t("results.export.footer"))}</span>
        <span>${escapeHtml(generatedDate)}</span>
      </footer>
    </main>
  </body>
</html>`;
}

export function buildResultDocumentFilename(
  name: string,
  variant: ResultDocumentVariant,
): string {
  const normalizedName = name
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const subject = normalizedName || "career-compass";
  const suffix = variant === "parent" ? "parent-guide" : "career-compass";
  return `tareeq-${subject}-${suffix}.html`;
}

function downloadDocument(html: string, filename: string): void {
  const blobUrl = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

export function openResultDocument(
  html: string,
  fallbackFilename: string,
): ResultDocumentOpenMethod {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    downloadDocument(html, fallbackFilename);
    return "download";
  }

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
  return "print";
}
