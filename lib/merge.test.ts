import { describe, it, expect } from 'vitest'
import { mergeEvents, mergeWithDiff, isEmptyDiff } from './merge'
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

describe('mergeWithDiff', () => {
  const extracted = (o: Partial<ExtractedEvent>) => ev({ origDate: o.date ?? '2026-09-14', origTitle: o.title ?? 'Quiz 1', source: 'a line', ...o })

  it('reports nothing on a first extraction', () => {
    const { diff } = mergeWithDiff([], [extracted({ id: 'a' })])
    expect(isEmptyDiff(diff)).toBe(true)
  })

  it('recognises a deadline that moved rather than adding a second one', () => {
    const existing = [extracted({ id: 'a', date: '2026-09-14', title: 'Essay' })]
    const fresh = [extracted({ id: 'x', date: '2026-09-21', title: 'Essay' })]
    const { events, diff } = mergeWithDiff(existing, fresh)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ id: 'a', date: '2026-09-21' })
    expect(diff.moved).toEqual([{ id: 'a', from: '2026-09-14', to: '2026-09-21' }])
    expect(diff.added).toEqual([])
  })

  it('does not overwrite a date the student corrected by hand', () => {
    const existing = [extracted({ id: 'a', date: '2026-09-16', origDate: '2026-09-14', title: 'Essay' })]
    const { events, diff } = mergeWithDiff(existing, [extracted({ id: 'x', date: '2026-09-21', title: 'Essay' })])
    expect(events[0].date).toBe('2026-09-16')
    expect(diff.moved).toEqual([])
  })

  it('flags a row the new file no longer mentions instead of deleting it', () => {
    const existing = [extracted({ id: 'a', title: 'Dropped quiz' }), extracted({ id: 'b', date: '2026-10-01', title: 'Essay' })]
    const { events, diff } = mergeWithDiff(existing, [extracted({ id: 'x', date: '2026-10-01', title: 'Essay' })])
    expect(events).toHaveLength(2)
    expect(diff.missing).toEqual(['a'])
    expect(events.find((e) => e.id === 'a')!.missing).toBe(true)
  })

  it('never flags a row the student typed themselves', () => {
    const existing = [ev({ id: 'mine', title: 'Party', date: '2026-12-01' })]
    const { diff } = mergeWithDiff(existing, [extracted({ id: 'x' })])
    expect(diff.missing).toEqual([])
  })

  it('clears a missing flag when the row comes back', () => {
    const existing = [extracted({ id: 'a', title: 'Essay', missing: true })]
    const { events, diff } = mergeWithDiff(existing, [extracted({ id: 'x', title: 'Essay' })])
    expect(events[0].missing).toBeUndefined()
    expect(diff.missing).toEqual([])
  })

  it('keeps two deadlines that share a title apart', () => {
    const existing = [extracted({ id: 'a', date: '2026-09-14', title: 'Quiz' }), extracted({ id: 'b', date: '2026-10-14', title: 'Quiz' })]
    const { events, diff } = mergeWithDiff(existing, [
      extracted({ id: 'x', date: '2026-09-14', title: 'Quiz' }),
      extracted({ id: 'y', date: '2026-10-14', title: 'Quiz' }),
    ])
    expect(events).toHaveLength(2)
    expect(isEmptyDiff(diff)).toBe(true)
  })

  it('reports a genuinely new deadline', () => {
    const existing = [extracted({ id: 'a', title: 'Quiz 1' })]
    const { events, diff } = mergeWithDiff(existing, [extracted({ id: 'x', title: 'Quiz 1' }), extracted({ id: 'y', date: '2026-11-01', title: 'Final' })])
    expect(events).toHaveLength(2)
    expect(diff.added).toEqual(['y'])
  })

  it('matches titles across punctuation and case', () => {
    const existing = [extracted({ id: 'a', date: '2026-09-14', title: 'Reading Response #1' })]
    const { diff } = mergeWithDiff(existing, [extracted({ id: 'x', date: '2026-09-20', title: 'reading response 1' })])
    expect(diff.moved.map((m) => m.id)).toEqual(['a'])
  })
})

describe('mergeWithDiff: rows the student kept themselves', () => {
  it('never retires a manual row, even though it carries a syllabus line', () => {
    const kept: ExtractedEvent = {
      id: 'k1',
      date: '2027-05-04',
      title: 'Final exam',
      source: 'May 4: Final exam',
      manual: true,
      confidence: 'low',
      include: true,
    }
    const existing: ExtractedEvent[] = [
      { id: 'a', date: '2026-09-14', title: 'Quiz', origDate: '2026-09-14', origTitle: 'Quiz', source: 'Sept 14: Quiz', confidence: 'high', include: true },
      kept,
    ]
    const fresh: ExtractedEvent[] = [
      { id: 'b', date: '2026-09-14', title: 'Quiz', origDate: '2026-09-14', origTitle: 'Quiz', source: 'Sept 14: Quiz', confidence: 'high', include: true },
    ]
    const { events, diff } = mergeWithDiff(existing, fresh)
    expect(events.find((e) => e.id === 'k1')?.missing).toBeUndefined()
    expect(diff.missing).toEqual([])
  })
})

