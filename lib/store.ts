import { extractEvents, newId, type ExtractedEvent, type Term } from './extract'
import { mergeEvents } from './merge'
import type { Reminder } from './ics'

export type Course = {
  id: string
  name: string
  term: Term
  text: string
  events: ExtractedEvent[]
  extracted: boolean
}

export type State = { courses: Course[]; reminder: Reminder }

export type Action =
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; patch: Partial<Pick<Course, 'name' | 'term' | 'text'>> }
  | { type: 'setEvents'; id: string; events: ExtractedEvent[] }
  | { type: 'mergeEvents'; id: string; events: ExtractedEvent[] }
  | { type: 'extractAll' }
  | { type: 'addFromFiles'; files: { name: string; text: string }[] }
  | { type: 'updateEvent'; courseId: string; eventId: string; patch: Partial<ExtractedEvent> }
  | { type: 'addEvent'; courseId: string }
  | { type: 'deleteEvent'; courseId: string; eventId: string }
  | { type: 'setReminder'; reminder: Reminder }
  | { type: 'clear' }
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
  return { id: newId(), name: '', term: defaultTerm(), text: '', events: [], extracted: false }
}

export function initialState(): State {
  return { courses: [newCourse()], reminder: '1d' }
}

function mapCourse(state: State, id: string, fn: (c: Course) => Course): State {
  return { ...state, courses: state.courses.map((c) => (c.id === id ? fn(c) : c)) }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, courses: [...state.courses, newCourse()] }
    case 'remove':
      if (state.courses.length <= 1) return state
      return { ...state, courses: state.courses.filter((c) => c.id !== action.id) }
    case 'update':
      return mapCourse(state, action.id, (c) => ({ ...c, ...action.patch }))
    case 'setEvents':
      return mapCourse(state, action.id, (c) => ({ ...c, events: action.events, extracted: true }))
    case 'mergeEvents':
      return mapCourse(state, action.id, (c) => ({
        ...c,
        events: mergeEvents(c.events, action.events),
        extracted: true,
      }))
    case 'extractAll':
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.text.trim() ? { ...c, events: mergeEvents(c.events, extractEvents(c.text, c.term)), extracted: true } : c,
        ),
      }
    case 'addFromFiles': {
      const courses = [...state.courses]
      let first = true
      for (const f of action.files) {
        const blank = first && courses.length > 0 && !courses[courses.length - 1].name.trim() && !courses[courses.length - 1].text.trim()
        first = false
        const base = blank ? courses.pop()! : newCourse()
        const name = base.name.trim() || f.name
        const events = mergeEvents(base.events, extractEvents(f.text, base.term))
        courses.push({ ...base, name, text: f.text, events, extracted: true })
      }
      return { ...state, courses }
    }
    case 'setReminder':
      return { ...state, reminder: action.reminder }
    case 'updateEvent':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.map((e) => (e.id === action.eventId ? { ...e, ...action.patch } : e)),
      }))
    case 'addEvent':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        extracted: true,
        events: [
          ...c.events,
          { id: newId(), date: '', title: '', confidence: 'high', include: true },
        ],
      }))
    case 'deleteEvent':
      return mapCourse(state, action.courseId, (c) => ({
        ...c,
        events: c.events.filter((e) => e.id !== action.eventId),
      }))
    case 'clear':
      return initialState()
    case 'hydrate':
      return action.state
  }
}

const SEASONS = new Set(['Fall', 'Spring', 'Summer', 'Winter'])
const REMINDERS = new Set(['1d', '2d', 'morning', 'none'])
const isStr = (v: unknown): v is string => typeof v === 'string'

function sanitizeEvent(raw: unknown): ExtractedEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (!isStr(e.id) || !isStr(e.date) || !isStr(e.title)) return null
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    time: isStr(e.time) ? e.time : undefined,
    confidence: e.confidence === 'low' ? 'low' : 'high',
    reason: isStr(e.reason) ? e.reason : undefined,
    include: e.include !== false,
    origDate: isStr(e.origDate) ? e.origDate : undefined,
    origTitle: isStr(e.origTitle) ? e.origTitle : undefined,
  }
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
  return {
    id: c.id,
    name: isStr(c.name) ? c.name : '',
    term,
    text: isStr(c.text) ? c.text : '',
    events,
    extracted: c.extracted === true,
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
  return { courses, reminder }
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
