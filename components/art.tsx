import Image from "next/image";
import {
  ART_ALT,
  ART_FOCUS,
  ART_HEIGHT,
  ART_PIECES,
  ART_SRC,
  ART_WIDTH,
  flightOffset,
  type ArtPart,
} from "@/lib/art";

/**
 * The illustration, assembled on the landing page and cropped everywhere else.
 *
 * Images go through next/image, so the source PNGs are re-encoded and sized per device rather
 * than shipped as they sit on disk.
 */

/**
 * The hero: five slices of the same render, positioned back into their original places.
 *
 * The paper arrives, the calendar arrives, and then the three cut-out dates actually fly the
 * distance from the syllabus to their places on the calendar, one after another. The travel is
 * the point. Fading each piece in where it already sits reads as a picture loading; a date
 * leaving one object and landing on another reads as the product working, which is the whole
 * job of the picture. Each card's start is derived from its own measured box (lib/art.ts) so
 * moving a piece cannot leave its flight path behind.
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
    >
      {ART_PIECES.map((piece, i) => {
        const fly = flightOffset(piece);
        return (
          <Image
            key={piece.id}
            src={piece.src}
            alt={piece.id === "document" ? ART_ALT : ""}
            width={piece.px[0]}
            height={piece.px[1]}
            priority={i < 2}
            sizes="(min-width: 1024px) 520px, 92vw"
            className={`art-piece art-${piece.id}`}
            style={
              {
                left: `${piece.left}%`,
                top: `${piece.top}%`,
                width: `${piece.width}%`,
                height: `${piece.height}%`,
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
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={ART_SRC}
        alt=""
        width={ART_WIDTH}
        height={ART_HEIGHT}
        sizes={`${Math.round(size * 2)}px`}
        className="h-full w-full object-cover"
        style={{
          objectPosition: `${ART_FOCUS[part]} 50%`,
          transform: "scale(1.9)",
        }}
      />
    </div>
  );
}
