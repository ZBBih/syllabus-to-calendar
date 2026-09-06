/**
 * The illustration.
 *
 * Flat shapes in the site's own tokens, drawn as SVG rather than shipped as a picture. A
 * generated render was tried first and is in git history: it looked good on its own and wrong
 * on the page, because a photograph of textured paper with real shadows cannot sit on a flat,
 * crisp interface no matter how carefully its colours are matched. Retoning it only moved the
 * problem; the style was the problem.
 *
 * Drawing it instead means it inherits light and dark for free, stays sharp at any size, weighs
 * a couple of kilobytes inside the HTML, and can be taken apart for animation without any
 * slicing.
 *
 * The composition is the product in one line: the syllabus on the left, three dates crossing the
 * middle, the calendar on the right filling in as they arrive. The smaller spots crop to one
 * half rather than needing art of their own.
 */

export const ART_ALT =
  "A syllabus on the left, its dates flying across into a calendar on the right";

/** The drawing's own coordinate space. Everything below is in these units. */
export const ART_WIDTH = 480;
export const ART_HEIGHT = 360;

/** The syllabus. */
export const SHEET = { x: 12, y: 40, w: 142, h: 280, r: 12 };

/** Its printed lines: distance down from the top of the sheet, and how wide. */
export const SHEET_LINES = [
  { y: 74, w: 96 },
  { y: 96, w: 118 },
  { y: 118, w: 78 },
  { y: 140, w: 110 },
  { y: 162, w: 88 },
  { y: 184, w: 116 },
  { y: 206, w: 70 },
];

/** The calendar. */
export const CAL = { x: 286, y: 52, w: 182, h: 256, r: 14, header: 46 };

/** Its grid of days. */
export const GRID = { cols: 5, rows: 4, size: 26, gap: 8, top: 74, left: 296 };

export function dayBox(col: number, row: number) {
  return {
    x: GRID.left + col * (GRID.size + GRID.gap),
    y: CAL.y + GRID.top + row * (GRID.size + GRID.gap),
    size: GRID.size,
  };
}

/**
 * The days that get marked, and the date that marks each one.
 *
 * Three dates leave the syllabus and three days fill in, one per arrival. A fourth fills at the
 * end, so the calendar keeps going for a beat after the last one lands rather than stopping dead
 * with the animation.
 */
export const MARKED = [
  { col: 3, row: 0, chip: 0 },
  { col: 1, row: 1, chip: 1 },
  { col: 4, row: 2, chip: 2 },
  { col: 2, row: 3, chip: null },
];

/**
 * The dates in flight, at rest.
 *
 * They sit between the two objects, already out of the syllabus and not yet on the calendar,
 * which is the state the picture has to hold when nothing is moving.
 */
export const CHIPS = [
  { x: 176, y: 92, w: 74, h: 32 },
  { x: 192, y: 152, w: 74, h: 32 },
  { x: 178, y: 212, w: 74, h: 32 },
];

/** Where a date starts: on the sheet, over its own printed line. */
export const CHIP_ORIGIN = { x: 34, y: 108 };
