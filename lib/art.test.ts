import { describe, it, expect } from "vitest";
import {
  ART_DAYS,
  ART_FOCUS,
  ART_HEIGHT,
  ART_PIECES,
  ART_SRC,
  ART_WIDTH,
  flightOffset,
} from "./art";

describe("the illustration", () => {
  it("points at files that ship in public", () => {
    expect(ART_SRC).toBe("/art/paper.png");
    expect(ART_WIDTH).toBe(1200);
    expect(ART_HEIGHT).toBe(896);
    for (const p of ART_PIECES)
      expect(p.src).toMatch(/^\/art\/parts\/[a-z0-9]+\.png$/);
  });

  it("crops the document from the left half and the calendar from the right", () => {
    expect(parseInt(ART_FOCUS.document)).toBeLessThan(50);
    expect(parseInt(ART_FOCUS.calendar)).toBeGreaterThan(50);
  });

  it("has the paper, three flying dates and the calendar", () => {
    expect(ART_PIECES.map((p) => p.id)).toEqual([
      "document",
      "card1",
      "card2",
      "card3",
      "calendar",
    ]);
  });

  it("keeps every piece inside the frame, so nothing is cut off or floats outside it", () => {
    for (const p of ART_PIECES) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.top).toBeGreaterThanOrEqual(0);
      expect(p.left + p.width).toBeLessThanOrEqual(100.01);
      expect(p.top + p.height).toBeLessThanOrEqual(100.01);
    }
  });

  it("places the paper left, the calendar right and the dates between them, left to right", () => {
    const mid = (id: string) => {
      const p = ART_PIECES.find((x) => x.id === id)!;
      return p.left + p.width / 2;
    };
    expect(mid("document")).toBeLessThan(mid("card1"));
    expect(mid("card1")).toBeLessThan(mid("card2"));
    expect(mid("card2")).toBeLessThan(mid("card3"));
    expect(mid("document")).toBeLessThan(mid("calendar"));
  });

  it("gives each slice a natural size that matches the box it is drawn in", () => {
    const frameAspect = ART_WIDTH / ART_HEIGHT;
    for (const p of ART_PIECES) {
      const boxAspect =
        ((p.width / 100) * ART_WIDTH) / ((p.height / 100) * ART_HEIGHT);
      const sliceAspect = p.px[0] / p.px[1];
      // A slice stretched to a box of a different shape would visibly distort the artwork.
      expect(Math.abs(boxAspect - sliceAspect) / sliceAspect).toBeLessThan(
        0.02,
      );
      expect(frameAspect).toBeGreaterThan(1);
    }
  });
});

describe("flightOffset", () => {
  it("sends each date back to the syllabus, so it has the gap to cross", () => {
    for (const piece of ART_PIECES.filter((p) => p.id.startsWith("card"))) {
      const { x, y } = flightOffset(piece);
      // Left and down, towards the paper: the dates all sit right of and above it.
      expect(x).toBeLessThan(-100);
      expect(y).toBeGreaterThan(100);
    }
  });

  it("puts the start on the paper, not off the frame", () => {
    for (const piece of ART_PIECES.filter((p) => p.id.startsWith("card"))) {
      const { x, y } = flightOffset(piece);
      const doc = ART_PIECES.find((p) => p.id === "document")!;
      const startX = piece.left + (x / 100) * piece.width;
      const startY = piece.top + (y / 100) * piece.height;
      expect(startX).toBeGreaterThan(doc.left);
      expect(startX + piece.width).toBeLessThan(doc.left + doc.width);
      expect(startY).toBeGreaterThan(doc.top);
      expect(startY + piece.height).toBeLessThan(doc.top + doc.height);
    }
  });
});

describe("the marked days", () => {
  const calendar = ART_PIECES.find((p) => p.id === "calendar")!;

  it("sits inside the calendar, so a day cannot fill in mid-air", () => {
    for (const day of ART_DAYS) {
      expect(day.left).toBeGreaterThan(calendar.left);
      expect(day.top).toBeGreaterThan(calendar.top);
      expect(day.left + day.width).toBeLessThan(calendar.left + calendar.width);
      expect(day.top + day.height).toBeLessThan(calendar.top + calendar.height);
    }
  });

  it("has one day per date in flight, plus one", () => {
    expect(ART_DAYS).toHaveLength(
      ART_PIECES.filter((p) => p.id.startsWith("card")).length + 1,
    );
  });

  it("reads down the calendar, not in the order the slicer happened to find them", () => {
    const tops = ART_DAYS.map((d) => d.top);
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  });
});
