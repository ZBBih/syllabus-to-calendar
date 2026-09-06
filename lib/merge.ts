import type { ExtractedEvent } from './extract'

/** What a re-run of the same syllabus changed. Empty on a first extraction. */
export type EventDiff = {
  added: string[]
  moved: { id: string; from: string; to: string }[]
  missing: string[]
}

export const EMPTY_DIFF: EventDiff = { added: [], moved: [], missing: [] }

export function isEmptyDiff(d: EventDiff | undefined | null): boolean {
  return !d || (d.added.length === 0 && d.moved.length === 0 && d.missing.length === 0)
}

export function diffCount(d: EventDiff | undefined | null): number {
  return d ? d.added.length + d.moved.length + d.missing.length : 0
}

function normTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function exactKey(e: ExtractedEvent) {
  return `${e.origDate ?? e.date}|${normTitle(e.origTitle ?? e.title)}`
}

/** A row the user typed by hand has no source line, so a re-run should never claim it went missing. */
function fromExtraction(e: ExtractedEvent) {
  return Boolean(e.source || e.origTitle !== undefined)
}

function sortEvents(events: ExtractedEvent[]) {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
}

/**
 * Fold a fresh extraction into the rows already on screen and report what changed.
 *
 * A syllabus is accurate the day it is written and starts drifting the week after, so the
 * common case is a student re-dropping a revised file. Rows are matched first on date and
 * title together, then on title alone, which is how a deadline that moved is recognised as
 * the same deadline rather than as a new one plus an orphan.
 *
 * Nothing is ever deleted. A row the new file no longer mentions is flagged instead, because
 * the professor dropping an assignment and the parser missing a line look identical from here
 * and only the student can tell them apart.
 */
export function mergeWithDiff(existing: ExtractedEvent[], fresh: ExtractedEvent[]): { events: ExtractedEvent[]; diff: EventDiff } {
  if (existing.length === 0) return { events: sortEvents(fresh), diff: EMPTY_DIFF }

  const rows = existing.map((e) => ({ ...e }))
  const unmatched = new Set(rows.map((_, i) => i))
  const diff: EventDiff = { added: [], moved: [], missing: [] }

  const byExact = new Map<string, number[]>()
  const byTitle = new Map<string, number[]>()
  rows.forEach((e, i) => {
    const push = (m: Map<string, number[]>, k: string) => m.set(k, [...(m.get(k) ?? []), i])
    push(byExact, exactKey(e))
    push(byTitle, normTitle(e.origTitle ?? e.title))
  })

  const take = (m: Map<string, number[]>, k: string): number | null => {
    const list = m.get(k)
    if (!list) return null
    while (list.length) {
      const i = list.shift()!
      if (unmatched.has(i)) return i
    }
    return null
  }

  const leftover: ExtractedEvent[] = []

  // Pass one: same date and same title. Nothing moved, keep the row exactly as the user left it.
  const stillFresh: ExtractedEvent[] = []
  for (const f of fresh) {
    const i = take(byExact, exactKey(f))
    if (i === null) stillFresh.push(f)
    else {
      unmatched.delete(i)
      rows[i].missing = undefined
    }
  }

  // Pass two: same title, different date. The deadline moved.
  for (const f of stillFresh) {
    const i = take(byTitle, normTitle(f.title))
    if (i === null) {
      leftover.push(f)
      continue
    }
    unmatched.delete(i)
    const row = rows[i]
    row.missing = undefined
    const userSetTheDate = row.origDate !== undefined && row.date !== row.origDate
    if (row.date !== f.date && !userSetTheDate) {
      diff.moved.push({ id: row.id, from: row.date, to: f.date })
      row.date = f.date
      row.origDate = f.date
      row.time = f.time ?? row.time
      row.source = f.source ?? row.source
    }
  }

  // Pass three: anything left in the new file is genuinely new.
  for (const f of leftover) {
    rows.push({ ...f })
    diff.added.push(f.id)
  }

  // Pass four: rows extraction found before and does not find now.
  for (const i of unmatched) {
    if (!fromExtraction(rows[i])) continue
    rows[i].missing = true
    diff.missing.push(rows[i].id)
  }

  return { events: sortEvents(rows), diff }
}

/**
 * Merge freshly extracted events into the existing review rows, discarding the change report.
 * Rows whose original date and title match keep the user's edits and checkbox.
 */
export function mergeEvents(existing: ExtractedEvent[], fresh: ExtractedEvent[]): ExtractedEvent[] {
  return mergeWithDiff(existing, fresh).events
}
