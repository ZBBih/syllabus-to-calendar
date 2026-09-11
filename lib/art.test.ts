import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ARROWS,
  ART_HEIGHT,
  ART_WIDTH,
  CAL,
  HERO_INK,
  JOY,
  CHIP,
  CROP,
  FILLED,
  GRID,
  SHEET,
  SHEET_LINES,
  dayBox,
} from "./art";

describe("the illustration", () => {
  it("reads left to right: syllabus, a date in transit, calendar", () => {
    expect(CHIP.x).toBeGreaterThan(SHEET.x + SHEET.w);
    expect(CHIP.x + CHIP.w).toBeLessThan(CAL.x);
  });

  it("keeps everything inside the frame", () => {
    const boxes = [SHEET, { ...CAL, y: CAL.y - 10, h: CAL.h + 10 }, CHIP];
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(ART_WIDTH);
      expect(b.y + b.h).toBeLessThanOrEqual(ART_HEIGHT);
    }
  });

  it("keeps the printed lines on the page", () => {
    for (const l of SHEET_LINES) {
      expect(SHEET.x + 14 + l.w).toBeLessThan(SHEET.x + SHEET.w);
      expect(SHEET.y + l.y + 12).toBeLessThan(SHEET.y + SHEET.h);
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

  it("fills no day twice, none outside the grid, and each in its own turn", () => {
    expect(new Set(FILLED.map((f) => `${f.col},${f.row}`)).size).toBe(
      FILLED.length,
    );
    for (const f of FILLED) {
      expect(f.col).toBeLessThan(GRID.cols);
      expect(f.row).toBeLessThan(GRID.rows);
    }
    expect(FILLED.map((f) => f.order).sort((a, b) => a - b)).toEqual(
      FILLED.map((_, i) => i),
    );
  });

  it("draws one arrow per date in flight, each leaving the sheet and reaching the calendar", () => {
    expect(ARROWS).toHaveLength(3);
    for (const a of ARROWS) {
      const nums = a.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      expect(nums[0]).toBeGreaterThanOrEqual(SHEET.x + SHEET.w);
      expect(nums[nums.length - 2]).toBeLessThanOrEqual(CAL.x);
    }
  });

  it("has three joy colours, one per date in flight, and an arrow ink for the green ground", () => {
    expect(JOY).toHaveLength(3);
    expect(HERO_INK.arrow).toBeTruthy();
  });

  it("crops onto the drawing, not past it", () => {
    for (const box of Object.values(CROP)) {
      const [x, y, w, h] = box.split(" ").map(Number);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(ART_WIDTH);
      expect(y + h).toBeLessThanOrEqual(ART_HEIGHT);
    }
  });

  /*
    The entrance delays are CSS classes rather than style attributes, because the
    Content-Security-Policy does not allow an inline style. Nothing in the type system ties the
    number of rules to the number of shapes, so adding a sheet line or a filled day would
    silently give the new one a 0ms delay and break the sequence. This is the thing that
    notices.
  */
  it("has a delay class in globals.css for every animated shape", () => {
    const css = readFileSync(
      path.resolve(import.meta.dirname, "../app/globals.css"),
      "utf8",
    );
    const expected = [
      ...SHEET_LINES.map((_, i) => [`art-line-${i}`, i * 90] as const),
      ...[0, 1, 2].map((i) => [`art-arrow-${i}`, 300 + i * 430] as const),
      ...[0, 1, 2].map((i) => [`art-chip-${i}`, 350 + i * 430] as const),
      ...FILLED.map((f) => [`art-cell-${f.order}`, 900 + f.order * 260] as const),
    ];
    for (const [cls, ms] of expected) {
      expect(css, `missing rule for .${cls}`).toContain(
        `.hero-art .${cls} { animation-delay: ${ms}ms; }`,
      );
    }
    // And no rule for a shape that does not exist, so a removed one does not linger.
    const declared = [...css.matchAll(/\.hero-art \.(art-(?:line|chip|cell|arrow)-\d+) \{/g)].map(
      (m) => m[1],
    );
    expect(declared.sort()).toEqual(expected.map(([c]) => c).sort());
  });
});
