// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { ExtractDemo, DEMO_TERM } from './extract-demo'
import { SAMPLE_TEXT } from '@/lib/sample'
import { extractEvents } from '@/lib/extract'
import { detectMeeting } from '@/lib/meeting'
import { extractWeights } from '@/lib/grades'

/** The real output of the real extractor, which is what the panel has to be showing. */
const events = extractEvents(SAMPLE_TEXT, DEMO_TERM)

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

/** The panel waits to be seen before it plays. In jsdom nothing is ever seen, so say it was. */
function seeImmediately() {
  window.IntersectionObserver = class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() {
      this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  } as unknown as typeof window.IntersectionObserver
}

const found = () => within(screen.getByRole('list', { name: /what it found/i })).queryAllByRole('listitem')

beforeEach(() => {
  vi.useFakeTimers()
  setReducedMotion(false)
  seeImmediately()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** Run the whole playback out. Generous: the panel decides its own pace. */
function playToEnd() {
  act(() => {
    vi.advanceTimersByTime(60_000)
  })
}

describe('ExtractDemo', () => {
  it('ends up showing every date the real extractor finds, and nothing it does not', () => {
    render(<ExtractDemo />)
    playToEnd()
    expect(found()).toHaveLength(events.length)
    for (const e of events) {
      expect(screen.getAllByText(e.title).length).toBeGreaterThan(0)
    }
  })

  it('reveals the syllabus a line at a time rather than all at once', () => {
    render(<ExtractDemo />)
    const atStart = found().length
    act(() => {
      vi.advanceTimersByTime(400)
    })
    const early = found().length
    playToEnd()

    expect(atStart).toBe(0)
    expect(early).toBeLessThan(events.length)
    expect(found()).toHaveLength(events.length)
  })

  it('skips the animation entirely when the visitor asked for less motion', () => {
    setReducedMotion(true)
    render(<ExtractDemo />)
    expect(found()).toHaveLength(events.length)
  })

  it('carries the end date of a range rather than flattening it to one day', () => {
    const range = events.find((e) => e.endDate)
    render(<ExtractDemo />)
    playToEnd()

    expect(range).toBeTruthy()
    expect(screen.getByText('Oct 20–21')).toBeTruthy()
  })

  it('names the weekly class meeting the same pass found', () => {
    const meeting = detectMeeting(SAMPLE_TEXT, DEMO_TERM)
    render(<ExtractDemo />)
    playToEnd()
    const also = within(screen.getByRole('region', { name: /also read/i }))

    expect(meeting).toBeTruthy()
    expect(also.getByText(/Mon, Wed, Fri/)).toBeTruthy()
    expect(also.getByText(/10:00.*10:50/)).toBeTruthy()
    expect(also.getByText(/Olin 204/)).toBeTruthy()
  })

  it('names the grading table the same pass found', () => {
    const weights = extractWeights(SAMPLE_TEXT)
    render(<ExtractDemo />)
    playToEnd()
    const also = within(screen.getByRole('region', { name: /also read/i }))

    expect(weights.length).toBeGreaterThan(0)
    for (const w of weights) {
      expect(also.getByText(new RegExp(`^${w.label}\\s+${w.weight}%$`))).toBeTruthy()
    }
  })

  it('holds the finished result rather than looping', () => {
    render(<ExtractDemo />)
    playToEnd()
    const settled = found().length
    playToEnd()
    expect(found()).toHaveLength(settled)
  })

  it('plays again from the start when asked', () => {
    render(<ExtractDemo />)
    playToEnd()
    fireEvent.click(screen.getByRole('button', { name: /again/i }))

    expect(found().length).toBeLessThan(events.length)
    playToEnd()
    expect(found()).toHaveLength(events.length)
  })

  it('offers no replay control until there is something to replay', () => {
    render(<ExtractDemo />)
    expect(screen.queryByRole('button', { name: /again/i })).toBeNull()
  })

  it('hands the visitor on to the sample when they have seen enough', () => {
    const onSample = vi.fn()
    render(<ExtractDemo onSample={onSample} />)
    playToEnd()
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))
    expect(onSample).toHaveBeenCalled()
  })
})
