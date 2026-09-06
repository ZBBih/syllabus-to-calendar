import { describe, it, expect } from 'vitest'
import { ART_FOCUS, ART_HEIGHT, ART_PIECES, ART_SRC, ART_WIDTH } from './art'

describe('the illustration', () => {
  it('points at files that ship in public', () => {
    expect(ART_SRC).toBe('/art/paper.png')
    expect(ART_WIDTH).toBe(1200)
    expect(ART_HEIGHT).toBe(896)
    for (const p of ART_PIECES) expect(p.src).toMatch(/^\/art\/parts\/[a-z0-9]+\.png$/)
  })

  it('crops the document from the left half and the calendar from the right', () => {
    expect(parseInt(ART_FOCUS.document)).toBeLessThan(50)
    expect(parseInt(ART_FOCUS.calendar)).toBeGreaterThan(50)
  })

  it('has the paper, three flying dates and the calendar', () => {
    expect(ART_PIECES.map((p) => p.id)).toEqual(['document', 'card1', 'card2', 'card3', 'calendar'])
  })

  it('keeps every piece inside the frame, so nothing is cut off or floats outside it', () => {
    for (const p of ART_PIECES) {
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.top).toBeGreaterThanOrEqual(0)
      expect(p.left + p.width).toBeLessThanOrEqual(100.01)
      expect(p.top + p.height).toBeLessThanOrEqual(100.01)
    }
  })

  it('places the paper left, the calendar right and the dates between them, left to right', () => {
    const mid = (id: string) => {
      const p = ART_PIECES.find((x) => x.id === id)!
      return p.left + p.width / 2
    }
    expect(mid('document')).toBeLessThan(mid('card1'))
    expect(mid('card1')).toBeLessThan(mid('card2'))
    expect(mid('card2')).toBeLessThan(mid('card3'))
    expect(mid('document')).toBeLessThan(mid('calendar'))
  })

  it('gives each slice a natural size that matches the box it is drawn in', () => {
    const frameAspect = ART_WIDTH / ART_HEIGHT
    for (const p of ART_PIECES) {
      const boxAspect = (p.width / 100) * ART_WIDTH / ((p.height / 100) * ART_HEIGHT)
      const sliceAspect = p.px[0] / p.px[1]
      // A slice stretched to a box of a different shape would visibly distort the artwork.
      expect(Math.abs(boxAspect - sliceAspect) / sliceAspect).toBeLessThan(0.02)
      expect(frameAspect).toBeGreaterThan(1)
    }
  })
})
