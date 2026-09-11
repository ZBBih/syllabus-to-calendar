import { describe, it, expect, vi } from "vitest";
import { PAGE_BATCH } from "./convert";

/**
 * Pages are read several at a time rather than one after another, which is worth having and is
 * also the kind of change that quietly scrambles a document. pdf.js itself is not what is under
 * test here: a stand-in returns each page after a delay that runs backwards, so the last page
 * always resolves first. If the reader depended on the order things came back in, this fails.
 */

let inFlight = 0;
let peak = 0;

const PAGES = 20;

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: PAGES,
      getPage: async (p: number) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        // Later pages come back sooner, so arrival order is the reverse of page order.
        await new Promise((r) => setTimeout(r, (PAGES - p) * 2));
        inFlight -= 1;
        return {
          getTextContent: async () => ({
            items: [{ str: `page ${p}`, transform: [0, 0, 0, 0, 0, 100] }],
          }),
        };
      },
    }),
  }),
}));

describe("reading a PDF several pages at a time", () => {
  it("keeps the pages in document order however they come back", async () => {
    const { fileToText } = await import("./convert");
    const text = await fileToText(
      new File([new Uint8Array(4)], "syllabus.pdf", {
        type: "application/pdf",
      }),
    );
    const lines = text.split("\n").filter(Boolean);

    expect(lines).toEqual(
      Array.from({ length: PAGES }, (_, i) => `page ${i + 1}`),
    );
  });

  it("reads more than one page at a time, and never more than the batch", async () => {
    const { fileToText } = await import("./convert");
    peak = 0;
    await fileToText(
      new File([new Uint8Array(4)], "syllabus.pdf", {
        type: "application/pdf",
      }),
    );

    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(PAGE_BATCH);
  });
});

describe("telling the caller how far through the PDF it is", () => {
  it("reports a rising fraction that ends at 1", async () => {
    const { fileToText } = await import("./convert");
    const seen: number[] = [];
    await fileToText(
      new File([new Uint8Array(4)], "syllabus.pdf", {
        type: "application/pdf",
      }),
      (stage, fraction) => {
        if (stage === "reading" && fraction !== undefined) seen.push(fraction);
      },
    );
    expect(seen.length).toBeGreaterThan(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen[seen.length - 1]).toBe(1);
  });
});
