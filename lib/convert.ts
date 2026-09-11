import { imageToText } from "./ocr";

export class UnsupportedFileError extends Error {
  constructor(public ext: string) {
    super(
      `Unsupported file type "${ext || "unknown"}". Please upload a PDF, Word (.docx), image, or text file, or paste the text.`,
    );
    this.name = "UnsupportedFileError";
  }
}

export class NoTextLayerError extends Error {
  constructor() {
    super(
      "This PDF is a scan with no text in it. Take a photo or screenshot of the page instead and we will read it, or paste the text.",
    );
    this.name = "NoTextLayerError";
  }
}

export const IMAGE_EXTS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "heic",
  "heif",
];

/**
 * Explicit extensions rather than a wildcard.
 *
 * `image/*` in an accept list makes the macOS and Windows file pickers walk the folder
 * resolving the type of every file before the window will paint, which on a Downloads folder
 * full of screenshots is a visible stall. Naming the extensions gets the same filtering with
 * none of that work.
 */
export const ACCEPT = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ...IMAGE_EXTS.map((e) => `.${e}`),
].join(",");
export const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Caps on the work, not just on the download.
 *
 * The byte limit is not what protects the tab: 25 MB of plain text is 25 million characters for
 * the date scanner to walk line by line, and a 25 MB PDF can hold thousands of pages, each one
 * a round trip through the PDF worker. A long syllabus is 30 pages and 60,000 characters, so
 * these leave an order of magnitude of room and still stop a course reader from freezing the
 * page with no way back.
 */
export const MAX_PAGES = 400;
export const MAX_TEXT_CHARS = 600_000;

/** How many PDF pages are read at once. Enough to keep the worker busy, few enough for a phone. */
export const PAGE_BATCH = 8;

export class FileTooLargeError extends Error {
  constructor(size: number) {
    super(
      `That file is ${(size / 1024 / 1024).toFixed(0)} MB. The limit is 25 MB; a syllabus PDF is usually under 5 MB.`,
    );
    this.name = "FileTooLargeError";
  }
}

export class TooManyPagesError extends Error {
  constructor(pages: number) {
    super(
      `That PDF is ${pages} pages. The limit is ${MAX_PAGES}; if this is a course reader, upload just the syllabus pages, or paste the schedule.`,
    );
    this.name = "TooManyPagesError";
  }
}

export class TextTooLongError extends Error {
  constructor(chars: number) {
    super(
      `That file holds ${Math.round(chars / 1000)},000 characters of text. The limit is ${Math.round(MAX_TEXT_CHARS / 1000)},000; a syllabus is a fraction of that. Paste just the schedule instead.`,
    );
    this.name = "TextTooLongError";
  }
}

/** Everything that becomes syllabus text goes through here, whatever file it came out of. */
function checkLength(text: string): string {
  if (text.length > MAX_TEXT_CHARS) throw new TextTooLongError(text.length);
  return text;
}

export function normalizeText(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extOf(file: File) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  return m ? m[1].toLowerCase() : "";
}

export function isImage(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXTS.includes(extOf(file));
}

async function pdfToText(
  file: File,
  onProgress?: ConvertProgress,
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  if (doc.numPages > MAX_PAGES) throw new TooManyPagesError(doc.numPages);

  const pageText = async (p: number) => {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let last: number | null = null;
    let buf = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (last !== null && Math.abs(y - last) > 2) buf += "\n";
      else if (buf && !buf.endsWith("\n")) buf += " ";
      buf += item.str;
      last = y;
    }
    return buf;
  };

  // Pages were read strictly one after another, so a long syllabus spent most of its time
  // waiting rather than working. They are independent, so they are read in batches instead —
  // bounded rather than all at once, because a phone holding four hundred decoded pages in
  // memory at the same time is the other way to make this slow. Order is preserved.
  const pages: string[] = [];
  onProgress?.("reading", 0);
  for (let first = 1; first <= doc.numPages; first += PAGE_BATCH) {
    const batch = [];
    for (let p = first; p < first + PAGE_BATCH && p <= doc.numPages; p++)
      batch.push(pageText(p));
    pages.push(...(await Promise.all(batch)));
    onProgress?.("reading", pages.length / doc.numPages);
  }
  const text = normalizeText(pages.join("\n\n"));
  if (!text) throw new NoTextLayerError();
  return checkLength(text);
}

async function docxToText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return checkLength(normalizeText(value));
}

/**
 * How far along a read is. `reading` is the file itself: for a PDF the fraction is pages done,
 * for anything else it is absent, because there is no meaningful middle to a Word file. `scanning`
 * is the recogniser working through a picture, with its own fraction.
 */
export type ConvertProgress = (
  stage: "reading" | "scanning",
  fraction?: number,
) => void;

export async function fileToText(
  file: File,
  onProgress?: ConvertProgress,
): Promise<string> {
  if (file.size > MAX_BYTES) throw new FileTooLargeError(file.size);
  const ext = extOf(file);
  const mime = file.type;
  onProgress?.("reading");
  if (isImage(file)) {
    onProgress?.("scanning", 0);
    return checkLength(
      normalizeText(
        await imageToText(file, (f) => onProgress?.("scanning", f)),
      ),
    );
  }
  if (ext === "pdf" || mime === "application/pdf")
    return pdfToText(file, onProgress);
  if (ext === "docx") return docxToText(file);
  if (ext === "txt" || ext === "md" || mime.startsWith("text/"))
    return checkLength(normalizeText(await file.text()));
  throw new UnsupportedFileError(ext);
}
