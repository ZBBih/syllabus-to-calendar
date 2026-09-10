import { extractEvents, newId, type ExtractedEvent, type Term } from './extract'
import { mergeWithDiff, EMPTY_DIFF, type EventDiff } from './merge'
import { type ExportedEntry, type Meeting, type Reminder } from './ics'
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

/**
 * Which class a dropped file belongs to, or -1 for a class that is not on screen yet.
 *
 * Matching is exact once case and spacing are set aside. A false match folds two real classes
 * into one and loses a syllabus, which is far worse than the duplicate row a missed match
 * leaves behind, so nothing cleverer than this is wanted here.
 */
function sameClassIndex(courses: Course[], name: string): number {
  const key = norm(name)
  if (!key) return -1
  return courses.findIndex((c) => c.text.trim() !== '' && norm(c.name) === key)
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
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
        // The file name is the first guess, and the text answers when it has nothing to say: a
        // pasted syllabus has no file name, and a class with dates cannot leave the first screen
        // unnamed. The text also wins when it names a course code and the file name does not,
        // because a photographed syllabus is called IMG_4821 and its first line is CHEM 120.
        const fromText = nameFromText(f.text)
        const fromFile = f.name.trim()
        const guess = looksLikeCode(fromText) && !looksLikeCode(fromFile) ? fromText : fromFile || fromText
        // A file naming a class already on screen is the revised syllabus, not a second class.
        // The drop zone is the only thing on this screen that takes a file, so it is where a
        // student brings the update the whole re-read feature exists for; adding a duplicate
        // class instead split the term in two and hid the change report.
        const i = sameClassIndex(courses, guess)
        if (i !== -1) {
          const term = termFromText(f.text) ?? courses[i].term
          courses[i] = { ...reread(courses[i], f.text, term), viaPhoto: f.viaPhoto === true ? true : undefined }
          continue
        }
        const last = courses[courses.length - 1]
        const blank = first && courses.length > 0 && !last.name.trim() && !last.text.trim()
        first = false
        const base = blank ? courses.pop()! : newCourse()
        const name = base.name.trim() || guess
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
        // Every edit a student makes to a row comes through here, which makes it the one place
        // that can say a date was typed rather than read. A re-read of the syllabus honours
        // that: the professor may move a deadline, but not one the student has already fixed.
        events: c.events.map((e) => {
          if (e.id !== action.eventId) return e
          const retyped = action.patch.date !== undefined && action.patch.date !== e.date
          return retyped ? { ...e, ...action.patch, userDated: true } : { ...e, ...action.patch }
        }),
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
      //
      // The class tag goes with them. It is only there so a per-class file can withdraw its own
      // rows, and there are no classes left to export one for; a bare hash of a course code is
      // guessable from a course catalogue, which is exactly what this is meant to prevent.
      return {
        ...initialState(),
        lastExport: state.lastExport.map((e) => ({ ...e, summary: '', courseTag: undefined })),
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
