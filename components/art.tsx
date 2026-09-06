'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { ART, ART_HEIGHT, ART_KEY, ART_ORDER, ART_WIDTH, DEFAULT_ART, isArtStyle, type ArtStyle } from '@/lib/art'

/**
 * The illustration, and the crops of it used elsewhere on the site.
 *
 * All three renders put the syllabus on the left and the calendar on the right, so cropping to
 * one half gives a second and third piece of art for free: the document introduces the upload
 * screen, the calendar closes the export screen, and nothing had to be drawn twice.
 *
 * Images go through next/image so they are re-encoded and sized per device rather than served
 * as the megabyte-plus source PNG.
 */

// A tiny store so every piece of art on the page switches together while a style is being picked.
const listeners = new Set<() => void>()

function readStyle(): ArtStyle {
  try {
    const saved = localStorage.getItem(ART_KEY)
    if (isArtStyle(saved)) return saved
  } catch {
    /* storage can be blocked; the default is fine */
  }
  return DEFAULT_ART
}

export function setArtStyle(style: ArtStyle) {
  try {
    localStorage.setItem(ART_KEY, style)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useArt() {
  return ART[useSyncExternalStore(subscribe, readStyle, () => DEFAULT_ART)]
}

/** The full illustration. Reveals left to right on load, in the direction the picture reads. */
export function HeroArt({ className = '' }: { className?: string }) {
  const art = useArt()
  return (
    <div className={`art-reveal relative ${className}`}>
      <Image
        key={art.id}
        src={art.src}
        alt="A syllabus on the left, its dates flying across into a calendar on the right"
        width={ART_WIDTH}
        height={ART_HEIGHT}
        priority
        sizes="(min-width: 1024px) 480px, 92vw"
        className="h-auto w-full"
      />
      <span className="art-sweep" aria-hidden="true" />
    </div>
  )
}

/** Half the illustration, squared off, for the smaller spots. */
export function ArtCrop({
  part,
  className = '',
  size = 220,
}: {
  part: 'document' | 'calendar'
  className?: string
  size?: number
}) {
  const art = useArt()
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Image
        src={art.src}
        alt=""
        width={ART_WIDTH}
        height={ART_HEIGHT}
        sizes={`${size * 2}px`}
        className="h-full w-full object-cover"
        style={{ objectPosition: `${part === 'document' ? art.documentX : art.calendarX} 50%`, transform: 'scale(1.9)' }}
      />
    </div>
  )
}

/**
 * A temporary control for choosing between the three renders in place.
 *
 * Once a style is settled on, delete this component, drop the two unused files from
 * public/art, and set DEFAULT_ART. Nothing else has to change.
 */
export function ArtPicker({ className = '' }: { className?: string }) {
  const current = useArt()
  return (
    <div className={`card-sunk p-3 ${className}`}>
      <p className="eyebrow">Compare the art</p>
      <div role="radiogroup" aria-label="Illustration style" className="mt-2 flex flex-wrap gap-1.5">
        {ART_ORDER.map((id) => {
          const on = current.id === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setArtStyle(id)}
              className={`btn btn-sm ${on ? 'btn-primary' : 'btn-secondary'}`}
            >
              {ART[id].label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{current.note}</p>
    </div>
  )
}
