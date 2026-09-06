import {
  ART_ALT,
  ART_DAYS,
  ART_FOCUS,
  ART_HEIGHT,
  ART_PIECES,
  ART_WIDTH,
  artUrl,
  flightOffset,
  type ArtPart,
  type ArtPiece,
} from "@/lib/art";

/**
 * The illustration, assembled on the landing page and cropped everywhere else.
 *
 * Every piece is painted as a CSS background rather than an <img>, because there are two of
 * each: one toned for the light palette and one for the dark. A browser fetches only the
 * background named by the rule that applies, so a visitor downloads the set for the theme they
 * are in and never the other. The theme is on <html> before first paint, so nothing flashes.
 */

/** The two files for one piece, handed to CSS as custom properties. */
function art(piece: { id: string }) {
  return {
    "--art-light": `url(${artUrl(piece.id, "light")})`,
    "--art-dark": `url(${artUrl(piece.id, "dark")})`,
  } as React.CSSProperties;
}

function box(piece: ArtPiece) {
  return {
    left: `${piece.left}%`,
    top: `${piece.top}%`,
    width: `${piece.width}%`,
    height: `${piece.height}%`,
  };
}

/**
 * The hero: five slices of the same render, positioned back into their original places.
 *
 * The paper arrives, the calendar arrives, and then the three cut-out dates actually fly the
 * distance from the syllabus to their places, one after another, and each arrival colours in a
 * day on the calendar. The travel and the fill are the point. Fading each piece in where it
 * already sits reads as a picture loading; a date leaving one object and changing another reads
 * as the product working, which is the whole job of the picture. Each card's start is derived
 * from its own measured box (lib/art.ts) so moving a piece cannot leave a stale flight path
 * behind, and the four days are separate sprites over an emptied grid because the render had
 * them filled in from the first frame, which left nothing to cause.
 *
 * It plays once and settles, because a loop next to a call to action competes with it. What
 * remains afterwards is a few pixels of drift on the dates, enough that the section is not a
 * screenshot.
 */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <div
      className={`art-stage relative ${className}`}
      style={{ aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}` }}
      role="img"
      aria-label={ART_ALT}
    >
      {[...ART_PIECES, ...ART_DAYS].map((piece) => {
        const fly = flightOffset(piece);
        return (
          <span
            key={piece.id}
            className={`art-piece art-${piece.id}`}
            style={
              {
                ...art(piece),
                ...box(piece),
                "--fly-x": `${fly.x.toFixed(1)}%`,
                "--fly-y": `${fly.y.toFixed(1)}%`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Half the illustration, squared off, for the smaller spots. */
export function ArtCrop({
  part,
  className = "",
  size = 160,
}: {
  part: ArtPart;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`art-crop shrink-0 ${className}`}
      style={{
        ...art({ id: "paper" }),
        width: size,
        height: size,
        backgroundPosition: `${ART_FOCUS[part]} 50%`,
      }}
      aria-hidden="true"
    />
  );
}
