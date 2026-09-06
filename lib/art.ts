/**
 * The illustration.
 *
 * One cut-paper render, used in five places. The composition puts the syllabus on the left,
 * three cut-out dates in flight across the middle, and the calendar on the right, which is what
 * lets a single piece of art serve the hero, the export payoff, the classes screen, the 404 and
 * the link preview: the smaller spots crop to one half rather than needing art of their own.
 *
 * Two other styles were rendered and compared in place before this one was chosen. They live in
 * git history rather than in the repo, because carrying unused megabytes is not free and mixing
 * illustration styles is the fastest way to make a site look assembled rather than designed.
 *
 * See docs/illustration.md for where it came from and how its transparency was recovered.
 */

export const ART_SRC = "/art/paper.png";
export const ART_WIDTH = 1200;
export const ART_HEIGHT = 896;
export const ART_ALT =
  "A paper syllabus on the left, its dates cut out and flying across into a paper calendar on the right";

/** Where each half sits horizontally, for cropping to the document or the calendar. */
export const ART_FOCUS = { document: "22%", calendar: "82%" } as const;
export type ArtPart = keyof typeof ART_FOCUS;

/**
 * The five pieces of the picture, so the hero can move them separately.
 *
 * Cut by scripts/slice-art.py, which finds them as connected components and hands every pixel of
 * shadow to whichever piece is nearest. Clipping one flat image into guessed regions got this
 * wrong: the tilted paper reaches further right than it looks, so its top corner landed in the
 * band meant for the flying dates. The boxes below are the real ones, as percentages of the
 * frame, and they include each piece's own shadow.
 */
export type ArtPiece = {
  id: string;
  src: string;
  /** Position and size within the frame, in percent. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Natural pixel size of the slice, for next/image. */
  px: [number, number];
};

export const ART_PIECES: ArtPiece[] = [
  {
    id: "document",
    src: "/art/parts/document.png",
    left: 1.083,
    top: 5.134,
    width: 45.583,
    height: 90.513,
    px: [547, 811],
  },
  {
    id: "card1",
    src: "/art/parts/card1.png",
    left: 34.667,
    top: 4.018,
    width: 13.167,
    height: 20.759,
    px: [158, 186],
  },
  {
    id: "card2",
    src: "/art/parts/card2.png",
    left: 49.5,
    top: 2.679,
    width: 10.25,
    height: 20.871,
    px: [123, 187],
  },
  {
    id: "card3",
    src: "/art/parts/card3.png",
    left: 60.5,
    top: 5.134,
    width: 16.083,
    height: 26.786,
    px: [193, 240],
  },
  {
    id: "calendar",
    src: "/art/parts/calendar.png",
    left: 47.5,
    top: 2.679,
    width: 51.083,
    height: 93.638,
    px: [613, 839],
  },
];

/**
 * Where a flying date starts: a point on the syllabus, in frame percentages.
 *
 * The pieces sit at their final places in the render, so on their own they can only fade in
 * where they already are. Giving them an origin on the paper is what turns the hero back into a
 * sequence: a date leaves the syllabus, crosses the gap, and lands on the calendar, which is the
 * one sentence the product has to make.
 */
export const ART_FLIGHT_ORIGIN = { x: 24, y: 52 } as const;

/**
 * The four days the calendar marks, cut out of it so they can be filled in one at a time.
 *
 * The render came with them already coloured, which is the right last frame and the wrong first
 * one: nothing can be shown to *cause* a date to land if the date is there from the start.
 * scripts/cells-art.py lifts the four squares out and patches the holes with a plain day copied
 * from the same row of the same photograph, so the paper grain and the grid's tilt survive.
 */
export const ART_DAYS: ArtPiece[] = [
  {
    id: "day1",
    src: "/art/parts/day1.png",
    left: 77.5,
    top: 47.433,
    width: 4.667,
    height: 6.027,
    px: [56, 54],
  },
  {
    id: "day2",
    src: "/art/parts/day2.png",
    left: 61.083,
    top: 52.902,
    width: 4.833,
    height: 5.915,
    px: [58, 53],
  },
  {
    id: "day3",
    src: "/art/parts/day3.png",
    left: 71.333,
    top: 60.714,
    width: 4.833,
    height: 6.027,
    px: [58, 54],
  },
  {
    id: "day4",
    src: "/art/parts/day4.png",
    left: 81.5,
    top: 68.75,
    width: 4.667,
    height: 5.915,
    px: [56, 53],
  },
];

/** How far a piece has to travel to reach its place, as a percentage of its own box. */
export function flightOffset(piece: ArtPiece) {
  return {
    x:
      ((ART_FLIGHT_ORIGIN.x - (piece.left + piece.width / 2)) / piece.width) *
      100,
    y:
      ((ART_FLIGHT_ORIGIN.y - (piece.top + piece.height / 2)) / piece.height) *
      100,
  };
}
