import Image from 'next/image'
import { ART_ALT, ART_FOCUS, ART_HEIGHT, ART_PIECES, ART_SRC, ART_WIDTH, type ArtPart } from '@/lib/art'

/**
 * The illustration, assembled on the landing page and cropped everywhere else.
 *
 * Images go through next/image, so the source PNGs are re-encoded and sized per device rather
 * than shipped as they sit on disk.
 */

/**
 * The hero: five slices of the same render, positioned back into their original places and each
 * arriving on its own beat. The paper slides in, the three cut-out dates fly across in sequence,
 * and the calendar lands last, which is the order the product works in and the order the picture
 * reads. A single pass of light closes it. Afterwards only the dates keep moving, by a few
 * pixels, which is enough that the section does not read as a screenshot.
 */
export function HeroArt({ className = '' }: { className?: string }) {
  return (
    <div className={`art-stage relative ${className}`} style={{ aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}` }}>
      {ART_PIECES.map((piece, i) => (
        <Image
          key={piece.id}
          src={piece.src}
          alt={piece.id === 'document' ? ART_ALT : ''}
          width={piece.px[0]}
          height={piece.px[1]}
          priority={i < 2}
          sizes="(min-width: 1024px) 520px, 92vw"
          className={`art-piece art-${piece.id}`}
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            width: `${piece.width}%`,
            height: `${piece.height}%`,
          }}
        />
      ))}
      <span className="art-sweep" aria-hidden="true" />
    </div>
  )
}

/** Half the illustration, squared off, for the smaller spots. */
export function ArtCrop({ part, className = '', size = 160 }: { part: ArtPart; className?: string; size?: number }) {
  return (
    <div className={`relative shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Image
        src={ART_SRC}
        alt=""
        width={ART_WIDTH}
        height={ART_HEIGHT}
        sizes={`${Math.round(size * 2)}px`}
        className="h-full w-full object-cover"
        style={{ objectPosition: `${ART_FOCUS[part]} 50%`, transform: 'scale(1.9)' }}
      />
    </div>
  )
}
