import { extractEvents, newId, type ExtractedEvent, type Term } from './extract'
import { mergeEvents } from './merge'

export type Course = {
  id: string
  name: string
  term: Term
  text: string
  events: ExtractedEvent[]
  extracted: boolean
}

export type State = { courses: Course[] }

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
  return { courses: [newCourse()] }
}

function mapCourse(state: State, id: string, fn: (c: Course) => Course): State {
  return { courses: state.courses.map((c) => (c.id === id ? fn(c) : c)) }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { courses: [...state.courses, newCourse()] }
    case 'remove':
      if (state.courses.length <= 1) return state
      return { courses: state.courses.filter((c) => c.id !== action.id) }
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
      return { courses }
    }
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

export function load(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as State
    if (!Array.isArray(parsed.courses) || parsed.courses.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function save(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable */
  }
}
