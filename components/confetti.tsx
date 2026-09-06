'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

/**
 * A one-shot confetti burst with a chime, drawn and synthesised by hand.
 *
 * No library and no audio file: the page's own content security policy only allows scripts
 * and media from this origin, and a celebration is not worth a dependency or a download.
 *
 * The canvas is rendered through a portal onto the body. A `position: fixed` element resolves
 * against the nearest transformed ancestor rather than the viewport, and the step wrapper
 * animates a transform, so rendering it in place pinned the burst to a box a third of the way
 * across the screen instead of centring it.
 */

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  tilt: number
  spin: number
  colour: string
  life: number
}

const GRAVITY = 0.3
const DRAG = 0.988
const LIFE = 170
const COUNT = 160

function palette(): string[] {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return [read('--joy-1', '#0d7a5c'), read('--joy-2', '#f5b841'), read('--joy-3', '#ef6f4c'), read('--joy-4', '#3d8bd8')]
}

/** A short rising arpeggio. Quiet, and it never plays without a click behind it. */
function chime() {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  let ctx: AudioContext
  try {
    ctx = new Ctor()
  } catch {
    return
  }
  const now = ctx.currentTime
  // C6, E6, G6, C7: a major triad resolving upward reads as "finished" rather than "alert".
  const notes = [1046.5, 1318.5, 1568.0, 2093.0]
  notes.forEach((freq, i) => {
    const at = now + i * 0.075
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.16, at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42)
    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.45)
  })
  setTimeout(() => ctx.close().catch(() => {}), 1200)
}

/** True once we are on the client, without writing state from an effect. */
const noSubscribe = () => () => {}
const onClient = () => true
const onServer = () => false

export function Confetti({ fireKey, sound = true }: { fireKey: number; sound?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mounted = useSyncExternalStore(noSubscribe, onClient, onServer)

  useEffect(() => {
    if (fireKey === 0 || !mounted) return
    const canvas = canvasRef.current
    if (!canvas) return

    const quiet = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (quiet) return

    if (sound) chime()

    // jsdom and older browsers hand back nothing here; a missing celebration is not an error.
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const colours = palette()
    const pieces: Piece[] = []
    const originX = width / 2
    const originY = height * 0.42

    for (let i = 0; i < COUNT; i++) {
      // A full circle of directions, squashed horizontally so the burst reads as a wide spray
      // rather than a ball, and given a slight upward bias so gravity has something to undo.
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.2
      const speed = 6 + Math.random() * 12
      pieces.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * 1.45,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 7,
        tilt: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.32,
        colour: colours[i % colours.length],
        life: LIFE,
      })
    }

    let frame = 0
    let running = true

    function tick() {
      if (!running || !ctx) return
      ctx.clearRect(0, 0, width, height)
      let alive = 0
      for (const p of pieces) {
        if (p.life <= 0) continue
        alive++
        p.vy += GRAVITY
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy
        p.tilt += p.spin
        p.life--

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.tilt)
        ctx.globalAlpha = Math.min(1, p.life / 45)
        ctx.fillStyle = p.colour
        // A squashed rectangle spinning on one axis reads as a tumbling paper scrap.
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (alive === 0) {
        ctx.clearRect(0, 0, width, height)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      ctx.clearRect(0, 0, width, height)
    }
  }, [fireKey, mounted, sound])

  if (!mounted) return null

  return createPortal(
    <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]" />,
    document.body,
  )
}
