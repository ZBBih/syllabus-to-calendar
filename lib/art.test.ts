import { describe, it, expect } from 'vitest'
import { ART, ART_ORDER, DEFAULT_ART, isArtStyle } from './art'

describe('art variants', () => {
  it('has one entry per style in the picker order', () => {
    expect(ART_ORDER).toHaveLength(3)
    for (const id of ART_ORDER) expect(ART[id].id).toBe(id)
  })

  it('points every variant at a file under public/art', () => {
    for (const id of ART_ORDER) expect(ART[id].src).toMatch(/^\/art\/[a-z]+\.png$/)
  })

  it('gives each variant its own crop points, since the compositions differ', () => {
    for (const id of ART_ORDER) {
      expect(ART[id].documentX).toMatch(/^\d+%$/)
      expect(ART[id].calendarX).toMatch(/^\d+%$/)
      expect(parseInt(ART[id].documentX)).toBeLessThan(parseInt(ART[id].calendarX))
    }
  })

  it('defaults to a style that exists', () => {
    expect(ART[DEFAULT_ART]).toBeDefined()
  })

  it('rejects anything that is not a known style, so a stale saved value cannot break the page', () => {
    expect(isArtStyle('paper')).toBe(true)
    expect(isArtStyle('watercolour')).toBe(false)
    expect(isArtStyle(null)).toBe(false)
    expect(isArtStyle(3)).toBe(false)
  })
})
