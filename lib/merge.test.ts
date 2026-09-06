import { describe, it, expect } from 'vitest'
import { mergeEvents } from './merge'
import type { ExtractedEvent } from './extract'

const ev = (o: Partial<ExtractedEvent>): ExtractedEvent => ({
  id: o.id ?? Math.random().toString(36).slice(2),
  date: '2026-09-14',
  title: 'Quiz 1',
  confidence: 'high',
  include: true,
  ...o,
})

describe('mergeEvents', () => {
  it('keeps edits on rows whose original date+title match', () => {
    const existing = [ev({ id: 'a', origDate: '2026-09-14', origTitle: 'Quiz 1', title: 'Quiz 1 (ch 1-3)', include: false })]
    const fresh = [ev({ id: 'x', origDate: '2026-09-14', origTitle: 'Quiz 1' })]
    const out = mergeEvents(existing, fresh)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'a', title: 'Quiz 1 (ch 1-3)', include: false })
  })

  it('adds new results that did not exist before', () => {
    const existing = [ev({ id: 'a', origDate: '2026-09-14', origTitle: 'Quiz 1' })]
    const fresh = [
      ev({ id: 'x', origDate: '2026-09-14', origTitle: 'Quiz 1' }),
      ev({ id: 'y', date: '2026-10-01', title: 'Essay', origDate: '2026-10-01', origTitle: 'Essay' }),
    ]
    const out = mergeEvents(existing, fresh)
    expect(out.map((e) => e.title)).toEqual(['Quiz 1', 'Essay'])
  })

  it('never removes rows, including user-added ones', () => {
    const existing = [ev({ id: 'user', date: '2026-12-01', title: 'Party', origDate: '', origTitle: '' })]
    const out = mergeEvents(existing, [])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('user')
  })

  it('treats legacy rows without originals as matching on current date+title', () => {
    const existing = [ev({ id: 'old', title: 'Quiz 1' })]
    const fresh = [ev({ id: 'x', origDate: '2026-09-14', origTitle: 'Quiz 1' })]
    const out = mergeEvents(existing, fresh)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('old')
  })

  it('sorts by date then time', () => {
    const existing = [ev({ id: 'b', date: '2026-10-01', title: 'B' })]
    const fresh = [ev({ id: 'a', date: '2026-09-01', title: 'A', origDate: '2026-09-01', origTitle: 'A' })]
    expect(mergeEvents(existing, fresh).map((e) => e.id)).toEqual(['a', 'b'])
  })
})
