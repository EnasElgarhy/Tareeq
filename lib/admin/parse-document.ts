/**
 * Server-side document text extraction for AI import. Turns an uploaded file
 * (CSV / TXT / MD / PDF / DOCX) into plain text the extractor can read.
 * Heavy parsers (pdf-parse, mammoth) are dynamically imported so they only load
 * when a binary format is actually uploaded.
 */

const TEXT_EXTENSIONS = new Set(["txt", "md", "csv"]);

export interface ParsedDocument {
  text: string;
  fileType: string;
}

function extensionOf(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

export async function extractTextFromUpload(file: File): Promise<ParsedDocument> {
  const ext = extensionOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (TEXT_EXTENSIONS.has(ext)) {
    return { text: buffer.toString("utf8"), fileType: ext };
  }

  if (ext === "pdf") {
    const mod = await import("pdf-parse");
    const pdf = (mod as { default?: (b: Buffer) => Promise<{ text?: string }> }).default ?? mod;
    const data = await (pdf as (b: Buffer) => Promise<{ text?: string }>)(buffer);
    return { text: data.text ?? "", fileType: "pdf" };
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: value ?? "", fileType: "docx" };
  }

  throw new Error(`Unsupported file type: .${ext}. Use CSV, TXT, MD, PDF, or DOCX.`);
}
