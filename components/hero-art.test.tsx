// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { HeroArt, REPLAY_EVERY } from './hero-art'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('HeroArt', () => {
  it('plays again after a rest, so the picture keeps moving while the page is open', () => {
    const { container } = render(<HeroArt onHero />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-run')).toBe('0')

    act(() => vi.advanceTimersByTime(REPLAY_EVERY))
    expect(svg.getAttribute('data-run')).toBe('1')

    act(() => vi.advanceTimersByTime(REPLAY_EVERY))
    expect(svg.getAttribute('data-run')).toBe('2')
  })

  it('holds still for a visitor who asked for less motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduced-motion'),
      addEventListener() {},
      removeEventListener() {},
    }))
    const { container } = render(<HeroArt onHero />)
    act(() => vi.advanceTimersByTime(REPLAY_EVERY * 3))
    expect(container.querySelector('svg')!.getAttribute('data-run')).toBe('0')
  })
})
