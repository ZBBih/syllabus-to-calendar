'use client'

import { useEffect, useRef } from 'react'

/**
 * A one-shot confetti burst, drawn by hand on a canvas.
 *
 * There is no library here on purpose: the page's own content security policy only allows
 * scripts from this origin, and a celebration is not worth a dependency. It fires once per
 * `fireKey` change, cleans itself up, and does nothing at all for anyone who has asked their
 * system to reduce motion.
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

const GRAVITY = 0.28
const DRAG = 0.992
const LIFE = 150

function palette(): string[] {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return [read('--joy-1', '#0d7a5c'), read('--joy-2', '#f5b841'), read('--joy-3', '#ef6f4c'), read('--joy-4', '#3d8bd8')]
}

export function Confetti({ fireKey }: { fireKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (fireKey === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // jsdom and older browsers hand back nothing here; a missing celebration is not an error.
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const colours = palette()
    const pieces: Piece[] = []
    // Two side cannons rather than a ceiling drop: it reads as a celebration, not weather.
    for (const side of [0, 1]) {
      const originX = side === 0 ? width * 0.08 : width * 0.92
      const aim = side === 0 ? 1 : -1
      for (let i = 0; i < 70; i++) {
        const speed = 9 + Math.random() * 11
        const angle = (-70 + Math.random() * 45) * (Math.PI / 180)
        pieces.push({
          x: originX,
          y: height * 0.72,
          vx: Math.cos(angle) * speed * aim,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 6,
          tilt: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.3,
          colour: colours[i % colours.length],
          life: LIFE,
        })
      }
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
        ctx.globalAlpha = Math.min(1, p.life / 40)
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
  }, [fireKey])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50" />
}
