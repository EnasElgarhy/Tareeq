/**
 * Minimal, dependency-free CSV handling for the question importer.
 * Handles quoted fields, embedded commas/newlines, and "" escaping.
 */

/** Parse CSV text into a matrix of string cells. */
export function parseCsv(text: string): string[][] {
  const s = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse CSV into header-keyed records (lower-cased headers), skipping blank lines. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

/** Map a user-typed type/kind (label or code) to an engine kind, or null. */
const TYPE_ALIASES: Record<string, string> = {
  single: "single",
  "multiple choice": "single",
  multiple_choice: "single",
  choice: "single",
  mc: "single",
  binary: "binary",
  "two options": "binary",
  "two option": "binary",
  yesno: "binary",
  "yes/no": "binary",
  select: "select",
  dropdown: "select",
  text: "text",
  "free text": "text",
  freetext: "text",
  open: "text",
};

export function normalizeKind(raw: string): string | null {
  return TYPE_ALIASES[raw.trim().toLowerCase()] ?? null;
}

/** Columns the importer reads (also the template header). */
export const CSV_COLUMNS = [
  "question_key",
  "pillar",
  "type",
  "title",
  "axis",
  "answer_key",
  "answer_text",
  "cluster",
  "driver",
  "axis_value",
] as const;

/** Downloadable template: header + a worked example of each question type. */
export const QUESTION_CSV_TEMPLATE = `question_key,pillar,type,title,axis,answer_key,answer_text,cluster,driver,axis_value
1,1,single,"Which subject excites you most?",,A,"Building things that work",ENG,,
1,1,single,"Which subject excites you most?",,B,"Understanding how people think",PPL,,
1,1,single,"Which subject excites you most?",,C,"Analyzing data and patterns",SCI,,
2,2,binary,"Do you prefer working alone or with a team?",workstyle,A,"Mostly alone",,,solo
2,2,binary,"Do you prefer working alone or with a team?",workstyle,B,"With a team",,,team
3,4,text,"What change do you want to make in the world?",,,,,,
`;
