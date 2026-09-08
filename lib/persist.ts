/**
 * Everything that stands between a student's semester and the browser it is saved in.
 *
 * Split out of `store.ts` so that the reducer is read on its own: the rules for changing state
 * and the rules for trusting state off disk are different jobs, and the file that held both was
 * the one place where adding a field to a course meant remembering two unrelated edits. The
 * round-trip test in `persist.test.ts` is what actually catches a forgotten one.
 */
import { type ExtractedEvent, type Term } from './extract'
import { type EventDiff } from './merge'
import { isHhMm, isIsoDate, isSafeUid, usableMeeting, type ExportedEntry, type Meeting, type Reminder } from './ics'
import { type Weight } from './grades'
import { defaultTerm, type Course, type State, type Step } from './store'

export const STORAGE_KEY = 'stc:v1'

const SEASONS = new Set(['Fall', 'Spring', 'Summer', 'Winter'])
const REMINDERS = new Set(['1d', '2d', 'morning', 'none'])
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function sanitizeEvent(raw: unknown): ExtractedEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (!isStr(e.id) || !isStr(e.date) || !isStr(e.title)) return null
  return {
    id: e.id,
    // A date that is not a date becomes a blank one rather than taking the row down with it:
    // the student keeps the title and the empty field to correct, and nothing malformed can
    // reach the calendar file in the meantime.
    date: isIsoDate(e.date) ? e.date : '',
    endDate: isIsoDate(e.endDate) ? e.endDate : undefined,
    title: e.title,
    time: isHhMm(e.time) ? e.time : undefined,
    confidence: e.confidence === 'low' ? 'low' : 'high',
    reason: isStr(e.reason) ? e.reason : undefined,
    include: e.include !== false,
    origDate: isStr(e.origDate) ? e.origDate : undefined,
    origTitle: isStr(e.origTitle) ? e.origTitle : undefined,
    source: isStr(e.source) ? e.source : undefined,
    manual: e.manual === true ? true : undefined,
    missing: e.missing === true ? true : undefined,
  }
}

function sanitizeWeight(raw: unknown): Weight | null {
  if (!raw || typeof raw !== 'object') return null
  const w = raw as Record<string, unknown>
  if (!isStr(w.id) || !isStr(w.label) || !isNum(w.weight)) return null
  return { id: w.id, label: w.label, weight: w.weight, earned: isNum(w.earned) ? w.earned : undefined }
}

function sanitizeDiff(raw: unknown): EventDiff | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const d = raw as Record<string, unknown>
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : [])
  const moved = Array.isArray(d.moved)
    ? d.moved
        .map((m) => (m && typeof m === 'object' ? (m as Record<string, unknown>) : null))
        .filter((m): m is Record<string, unknown> => m !== null && isStr(m.id) && isStr(m.from) && isStr(m.to))
        .map((m) => ({ id: m.id as string, from: m.from as string, to: m.to as string }))
    : []
  return { added: ids(d.added), moved, missing: ids(d.missing) }
}

function sanitizeEntry(raw: unknown): ExportedEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (!isStr(e.uid) || !isStr(e.date) || !isStr(e.summary)) return null
  if (!isSafeUid(e.uid) || !isIsoDate(e.date)) return null
  return { uid: e.uid, date: e.date, summary: e.summary }
}

const DAYS = new Set(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])
function sanitizeMeeting(raw: unknown): Meeting | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  if (!Array.isArray(m.days) || !isStr(m.start) || !isStr(m.end) || !isStr(m.firstDate) || !isStr(m.untilDate)) return null
  const days = m.days.filter((d): d is Meeting['days'][number] => isStr(d) && DAYS.has(d))
  if (days.length === 0) return null
  const meeting: Meeting = {
    days,
    start: m.start,
    end: m.end,
    location: isStr(m.location) ? m.location : undefined,
    firstDate: m.firstDate,
    untilDate: m.untilDate,
  }
  // A meeting is one recurring event or nothing; there is no half of it worth keeping, so a
  // malformed time or date drops the whole thing rather than leaving the builder to guess.
  return usableMeeting(meeting) ? meeting : null
}

function sanitizeCourse(raw: unknown): Course | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  if (!isStr(c.id)) return null
  const t = (c.term ?? {}) as Record<string, unknown>
  const term: Term =
    isStr(t.season) && SEASONS.has(t.season) && typeof t.year === 'number'
      ? { season: t.season as Term['season'], year: t.year }
      : defaultTerm()
  const events = Array.isArray(c.events) ? c.events.map(sanitizeEvent).filter((e): e is ExtractedEvent => e !== null) : []
  const weights = Array.isArray(c.weights) ? c.weights.map(sanitizeWeight).filter((w): w is Weight => w !== null) : []
  return {
    id: c.id,
    name: isStr(c.name) ? c.name : '',
    term,
    text: isStr(c.text) ? c.text : '',
    events,
    extracted: c.extracted === true,
    meeting: sanitizeMeeting(c.meeting),
    meetingIncluded: c.meetingIncluded !== false,
    weights,
    diff: sanitizeDiff(c.diff),
    viaPhoto: c.viaPhoto === true ? true : undefined,
  }
}

/** Parse a saved state, dropping anything malformed. Returns null if nothing usable remains. */
export function sanitize(raw: unknown): State | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!Array.isArray(s.courses)) return null
  const courses = s.courses.map(sanitizeCourse).filter((c): c is Course => c !== null)
  if (courses.length === 0) return null
  const reminder = isStr(s.reminder) && REMINDERS.has(s.reminder) ? (s.reminder as Reminder) : '1d'
  // A returning visitor with work in progress lands back on their step, not the sales pitch.
  const hasWork = courses.some((c) => c.events.length > 0 || c.text.trim() !== '')
  const savedStep = s.step === 1 || s.step === 2 || s.step === 3 ? (s.step as Step) : hasWork ? 1 : 0
  const step: Step = savedStep
  const activeCourseId = isStr(s.activeCourseId) && courses.some((c) => c.id === s.activeCourseId) ? s.activeCourseId : null
  const lastExport = Array.isArray(s.lastExport) ? s.lastExport.map(sanitizeEntry).filter((e): e is ExportedEntry => e !== null) : []
  const exportSequence = isNum(s.exportSequence) ? Math.max(0, Math.floor(s.exportSequence)) : 0
  return { courses, reminder, step, activeCourseId, lastExport, exportSequence }
}

export function load(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/** Returns false when the browser refused the write (quota, private mode, disabled storage). */
export function save(state: State): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/**
 * Coalesce a burst of state changes into one write.
 *
 * The saved state carries the full text of every syllabus loaded, so writing it on each
 * dispatch means re-serialising hundreds of kilobytes for every character typed into a class
 * name or a grade box — the shape of thing that makes typing feel laggy on the lower-end
 * phones half this audience carries. A trailing timer collapses the burst; `flush` exists so
 * that closing the tab mid-word still commits, and `cancel` so erasing the device is not undone
 * a moment later by a write that was already in flight.
 */
export function createSaver(
  write: (state: State) => boolean = save,
  delay = 400,
  onResult: (ok: boolean) => void = () => {},
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: State | null = null

  function commit() {
    if (pending === null) return
    const state = pending
    pending = null
    onResult(write(state))
  }

  return {
    queue(state: State) {
      pending = state
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        commit()
      }, delay)
    },
    flush() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      commit()
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      pending = null
    },
  }
}
