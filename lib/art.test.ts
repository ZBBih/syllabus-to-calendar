import { describe, it, expect } from "vitest";
import {
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  CHIPS,
  CHIP_ORIGIN,
  GRID,
  MARKED,
  SHEET,
  dayBox,
} from "./art";

describe("the illustration", () => {
  it("reads left to right: syllabus, dates in transit, calendar", () => {
    const sheetRight = SHEET.x + SHEET.w;
    for (const c of CHIPS) {
      expect(c.x).toBeGreaterThan(sheetRight);
      expect(c.x + c.w).toBeLessThan(CAL.x);
    }
  });

  it("keeps everything inside the frame", () => {
    const boxes = [
      { x: SHEET.x, y: SHEET.y, w: SHEET.w, h: SHEET.h },
      { x: CAL.x, y: CAL.y - 12, w: CAL.w, h: CAL.h + 12 },
      ...CHIPS,
    ];
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(ART_WIDTH);
      expect(b.y + b.h).toBeLessThanOrEqual(ART_HEIGHT);
    }
  });

  it("starts every date on the sheet, so it has the gap to cross", () => {
    for (let i = 0; i < CHIPS.length; i++) {
      const x = CHIP_ORIGIN.x;
      const y = CHIP_ORIGIN.y + i * 34;
      expect(x).toBeGreaterThan(SHEET.x);
      expect(x + CHIPS[i].w).toBeLessThan(SHEET.x + SHEET.w);
      expect(y).toBeGreaterThan(SHEET.y);
      expect(y + CHIPS[i].h).toBeLessThan(SHEET.y + SHEET.h);
    }
  });

  it("fits the grid inside the calendar, below its header", () => {
    for (let row = 0; row < GRID.rows; row++) {
      for (let col = 0; col < GRID.cols; col++) {
        const b = dayBox(col, row);
        expect(b.x).toBeGreaterThan(CAL.x);
        expect(b.x + b.size).toBeLessThan(CAL.x + CAL.w);
        expect(b.y).toBeGreaterThan(CAL.y + CAL.header);
        expect(b.y + b.size).toBeLessThan(CAL.y + CAL.h);
      }
    }
  });

  it("marks a day for every date in flight, plus one", () => {
    expect(MARKED).toHaveLength(CHIPS.length + 1);
    expect(MARKED.filter((m) => m.chip !== null).map((m) => m.chip)).toEqual([
      0, 1, 2,
    ]);
  });

  it("marks no day twice, and none outside the grid", () => {
    const seen = new Set(MARKED.map((m) => `${m.col},${m.row}`));
    expect(seen.size).toBe(MARKED.length);
    for (const m of MARKED) {
      expect(m.col).toBeLessThan(GRID.cols);
      expect(m.row).toBeLessThan(GRID.rows);
    }
  });

  it("reads down the calendar, so the fills do not jump about", () => {
    const rows = MARKED.map((m) => m.row);
    expect([...rows].sort((a, b) => a - b)).toEqual(rows);
  });
});
