import { extractEvents, newId, type ExtractedEvent, type Term } from './extract'
import { mergeWithDiff, EMPTY_DIFF, type EventDiff } from './merge'
import { isHhMm, isIsoDate, isSafeUid, usableMeeting, type ExportedEntry, type Meeting, type Reminder } from './ics'
import { detectMeeting } from './meeting'
import { extractWeights, mergeWeights, blankWeight, type Weight } from './grades'
import { looksLikeCode, nameFromText } from './course-name'
import { termFromText } from './term'

export type Course = {
  id: string
  name: string
  term: Term
  text: string
  events: ExtractedEvent[]
  extracted: boolean
  /** Weekly class meeting detected from the syllabus header, if any. */
  meeting?: Meeting | null
  /** Whether to put the weekly meeting on the calendar. Defaults to true when a meeting exists. */
  meetingIncluded?: boolean
  /** Grading breakdown from the syllabus, plus whatever scores the student has entered. */
  weights?: Weight[]
  /** What the last re-read of this syllabus changed. Cleared once the student has seen it. */
  diff?: EventDiff
  /** True when the text came from a photo or screenshot, which is the least reliable input. */
  viaPhoto?: boolean
}

/** 0 is the landing page. Once a class exists the flow never goes back to it. */
export type Step = 0 | 1 | 2 | 3
export type State = {
  courses: Course[]
  reminder: Reminder
  step: Step
  activeCourseId: string | null
  /** Every event the last export put on the calendar, so the next one can withdraw what is gone. */
  lastExport: ExportedEntry[]
  /** Grows with each export. Calendar apps ignore a repeated UID unless this has grown too. */
  exportSequence: number
}

export type Action =
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; patch: Partial<Pick<Course, 'name' | 'term' | 'text'>> }
  | { type: 'setTerm'; id: string; term: Term }
  | { type: 'setEvents'; id: string; events: ExtractedEvent[] }
  | { type: 'mergeEvents'; id: string; events: ExtractedEvent[] }
  | { type: 'addFromFiles'; files: { name: string; text: string; viaPhoto?: boolean }[] }
  | { type: 'updateEvent'; courseId: string; eventId: string; patch: Partial<ExtractedEvent> }
  | { type: 'addEvent'; courseId: string; preset?: { date: string; title: string; source?: string } }
  | { type: 'deleteEvent'; courseId: string; eventId: string }
  | { type: 'setReminder'; reminder: Reminder }
  | { type: 'setStep'; step: Step }
  | { type: 'setActive'; id: string | null }
  | { type: 'setIncludeAll'; courseId: string; include: boolean }
  | { type: 'setMeetingIncluded'; courseId: string; include: boolean }
  | { type: 'dismissDiff'; courseId: string }
  | { type: 'dropMissing'; courseId: string }
  | { type: 'keepMissing'; courseId: string }
  | { type: 'addWeight'; courseId: string }
  | { type: 'updateWeight'; courseId: string; weightId: string; patch: Partial<Weight> }
  | { type: 'removeWeight'; courseId: string; weightId: string }
  | { type: 'recordExport'; entries: ExportedEntry[] }
  | { type: 'clear' }
  | { type: 'reset' }
  | { type: 'hydrate'; state: State }

export const STORAGE_KEY = 'stc:v1'

export function defaultTerm(now = new Date()): Term {
  const m = now.getMonth()
  const y = now.getFullYear()
  if (m <= 3) return { season: 'Spring', year: y }
  if (m <= 6) return { season: 'Summer', year: y }
  if (m <= 10) return { season: 'Fall', year: y }
  return { season: 'Spring', year: y + 1 }
}

export function newCourse(): Course {
  return { id: newId(), name: '', term: defaultTerm(), text: '', events: [], extracted: false, meeting: null, meetingIncluded: true, weights: [] }
}

export function initialState(): State {
  return { courses: [newCourse()], reminder: '1d', step: 0, activeCourseId: null, lastExport: [], exportSequence: 0 }
}

function mapCourse(state: State, id: string, fn: (c: Course) => Course): State {
  return { ...state, courses: state.courses.map((c) => (c.id === id ? fn(c) : c)) }
}

/** Re-read a syllabus into a course: new dates, new meeting, new grading table, and a change report. */
function reread(course: Course, text: string, term = course.term): Course {
  const { events, diff } = mergeWithDiff(course.events, extractEvents(text, term))
  return {
    ...course,
    text,
    term,
    events,
    diff,
    extracted: true,
    meeting: detectMeeting(text, term),
    weights: mergeWeights(course.weights ?? [], extractWeights(text)),
  }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, courses: [...state.courses, newCourse()] }
    case 'remove': {
      // Every class is removable, including the last one. Taking the last away leaves a blank
      // course behind so the screen still has somewhere to type rather than going empty.
      const kept = state.courses.filter((c) => c.id !== action.id)
      const courses = kept.length > 0 ? kept : [newCourse()]
      return { ...state, courses, activeCourseId: state.activeCourseId === action.id ? null : state.activeCourseId }
    }
    case 'update':
      return mapCourse(state, action.id, (c) => ({ ...c, ...action.patch }))
    case 'setTerm':
      // The term decides which dates count as inside the semester, so changing it has to read
      // the syllabus again. Going through reread keeps every edit the student has already made
      // and reports what the new term recovered or dropped.
      return mapCourse(state, action.id, (c) => (c.text.trim() ? reread(c, c.text, action.term) : { ...c, term: action.term }))
    case 'setEvents':
      return mapCourse(state, action.id, (c) => ({ ...c, events: action.events, extracted: true }))
    case 'mergeEvents':
      return mapCourse(state, action.id, (c) => {
        const { events, diff } = mergeWithDiff(c.events, action.events)
        return {
          ...c,
          events,
          diff,
          extracted: true,
          meeting: detectMeeting(c.text, c.term),
          weights: mergeWeights(c.weights ?? [], extractWeights(c.text)),
        }
      })
    case 'setMeetingIncluded':
      return mapCourse(state, action.courseId, (c) => ({ ...c, meetingIncluded: action.include }))
    case 'addFromFiles': {
      const courses = [...state.courses]
      let first = true
      for (const f of action.files) {
        const last = courses[courses.length - 1]
        const blank = first && courses.length > 0 && !last.name.trim() && !last.text.trim()
        first = false
        const base = blank ? courses.pop()! : newCourse()
        // The file name is the first guess, and the text answers when it has nothing to say: a
        // pasted syllabus has no file name, and a class with dates cannot leave the first screen
        // unnamed. The text also wins when it names a course code and the file name does not,
        // because a photographed syllabus is called IMG_4821 and its first line is CHEM 120.
        const fromText = nameFromText(f.text)
        const fromFile = f.name.trim()
        const name = base.name.trim() || (looksLikeCode(fromText) && !looksLikeCode(fromFile) ? fromText : fromFile || fromText)
        const term = termFromText(f.text) ?? base.term
        courses.push({ ...reread(base, f.text, term), name, viaPhoto: f.viaPhoto === true })
      }
      return { ...state, courses }
    }
    case 'setReminder':
      return { ...state, reminder: action.reminder }
    case 'setStep':
      return { ...state, step: action.step }
    case 'setActive':
      return { ...state, activeCourseId: action.id }
    case 'setIncludeAll':
      return mapCourse(state, action.courseId, (c) => ({ ...c, events: c.events.map((e) => ({ ...e, include: action.include })) }))
    case 'updateEvent':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.map((e) => (e.id === action.eventId ? { ...e, ...action.patch } : e)),
      }))
    case 'addEvent':
      return mapCourse(state, action.courseId, (c) => {
        // A row added from the read report arrives with the date and the line already on it, so
        // recovering a deadline the term window hid is a tap rather than a retype. It counts as
        // low confidence because the student, not extraction, decided it belongs.
        const preset = action.preset
        const row: ExtractedEvent = preset
          ? {
              id: newId(),
              date: preset.date,
              title: preset.title,
              confidence: 'low',
              reason: 'added from the syllabus text',
              include: true,
              source: preset.source,
              manual: true,
            }
          : { id: newId(), date: '', title: '', confidence: 'high', include: true }
        return { ...c, extracted: true, events: [...c.events, row] }
      })
    case 'deleteEvent':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.filter((e) => e.id !== action.eventId),
        diff: c.diff ? { ...c.diff, added: c.diff.added.filter((id) => id !== action.eventId), missing: c.diff.missing.filter((id) => id !== action.eventId) } : c.diff,
      }))
    case 'dismissDiff':
      return mapCourse(state, action.courseId, (c) => ({ ...c, diff: EMPTY_DIFF }))
    case 'dropMissing':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.filter((e) => !e.missing),
        diff: c.diff ? { ...c.diff, missing: [] } : c.diff,
      }))
    case 'keepMissing':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.map((e) => (e.missing ? { ...e, missing: undefined } : e)),
        diff: c.diff ? { ...c.diff, missing: [] } : c.diff,
      }))
    case 'addWeight':
      return mapCourse(state, action.courseId, (c) => ({ ...c, weights: [...(c.weights ?? []), blankWeight()] }))
    case 'updateWeight':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        weights: (c.weights ?? []).map((w) => (w.id === action.weightId ? { ...w, ...action.patch } : w)),
      }))
    case 'removeWeight':
      return mapCourse(state, action.courseId, (c) => ({ ...c, weights: (c.weights ?? []).filter((w) => w.id !== action.weightId) }))
    case 'recordExport':
      return { ...state, lastExport: action.entries, exportSequence: state.exportSequence + 1 }
    case 'clear':
      // Deliberately keeps the export history: starting over should still update the calendar
      // that the previous run wrote to, rather than duplicating every event onto it.
      //
      // The titles go, though. A withdrawal is matched by UID alone, so the summary carries
      // nothing the calendar needs — and a student who starts over on a library machine should
      // not leave a readable list of what they were studying and when it was due behind them.
      return {
        ...initialState(),
        lastExport: state.lastExport.map((e) => ({ ...e, summary: '' })),
        exportSequence: state.exportSequence,
      }
    case 'reset':
      // The other kind of starting over: leave nothing at all. This is the one a student on a
      // shared computer wants, and it gives up the calendar correction to get it.
      return initialState()
    case 'hydrate':
      return action.state
  }
}

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
