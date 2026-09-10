import { buildIcs, exportedEntries, type CalendarEvent, type ExportedEntry, type Reminder } from './ics'
import { courseTag } from './uid'
import type { Course, State } from './store'

/** True when a row is complete enough to land in the calendar file. */
export function isComplete(e: CalendarEvent) {
  return Boolean(e.date && e.title.trim())
}

/** Rows that will actually be exported for a course. */
export function exportableEvents(c: Course) {
  return c.events.filter((e) => e.include !== false && isComplete(e))
}

export function exportable(c: Course) {
  return { name: c.name.trim(), events: exportableEvents(c), meeting: c.meetingIncluded === false ? null : c.meeting ?? null }
}

/**
 * Every row a class could have put on a calendar, ticked or not.
 *
 * A calendar identity is a hash of the class name and what extraction first found, not a
 * random per-run id, so this browser can name an event a different browser exported. That is
 * what lets a student take a term off their calendar from a laptop after importing from a
 * phone, or after clearing the site data that held the export history.
 */
export function retractable(c: Course) {
  return {
    name: c.name.trim(),
    events: c.events.filter(isComplete).map((e) => ({ ...e, include: true })),
    meeting: c.meeting ?? null,
  }
}

/** Courses that have exportable rows but no name; they would otherwise vanish from the file. */
export function unnamedWithEvents(courses: Course[]) {
  return courses.filter((c) => !c.name.trim() && exportableEvents(c).length > 0)
}

/** Courses complete enough to export at all. */
export function exportableCourses(courses: Course[]) {
  return courses.filter((c) => c.name.trim() && exportableEvents(c).length > 0)
}

/**
 * What the previous export put on the calendar that this one no longer wants.
 *
 * These go out as cancellations so a deadline the professor dropped, or a row the student
 * unticked on second thought, comes off the calendar instead of sitting there for the term.
 */
export function withdrawn(previous: ExportedEntry[], current: ExportedEntry[]): ExportedEntry[] {
  const keep = new Set(current.map((e) => e.uid))
  return previous.filter((e) => !keep.has(e.uid))
}

/** One entry per calendar identity, keeping the first seen. */
function byUid(entries: ExportedEntry[]): ExportedEntry[] {
  const seen = new Map<string, ExportedEntry>()
  for (const e of entries) if (!seen.has(e.uid)) seen.set(e.uid, e)
  return [...seen.values()]
}

export type ExportPlan = {
  ics: string
  /** Everything this file puts on the calendar, to be recorded once it is saved. */
  entries: ExportedEntry[]
  /** How many previously exported events this file withdraws. */
  cancelled: number
  /** How many events this file updates rather than creates. */
  updated: number
  /** How many events are new to the calendar. */
  created: number
}

function plan(courses: Course[], state: State, only?: string): ExportPlan {
  const shaped = courses.map(exportable)
  const entries = exportedEntries(shaped)
  const previous = new Set(state.lastExport.map((e) => e.uid))
  // A per-class file may only withdraw its own class, so it is matched against that class's
  // slice of the history and no more. A row saved before the tag existed carries none, so no
  // class can claim it and only a full export takes it off the calendar.
  const history = only ? state.lastExport.filter((e) => e.courseTag === only) : state.lastExport
  // With nothing ticked the student is asking for the whole thing back, which includes rows this
  // browser never exported itself: the calendar knows them by the same content-hashed id.
  const retraction =
    !only && entries.length === 0 ? exportedEntries(state.courses.filter((c) => c.name.trim()).map(retractable)) : []
  const cancelled = byUid([...withdrawn(history, entries), ...retraction])
  return {
    ics: buildIcs(shaped, state.reminder, { sequence: state.exportSequence, cancelled }),
    entries,
    cancelled: cancelled.length,
    updated: entries.filter((e) => previous.has(e.uid)).length,
    created: entries.filter((e) => !previous.has(e.uid)).length,
  }
}

export function planForAll(courses: Course[], state: State): ExportPlan {
  return plan(courses, state)
}

export function planForCourse(course: Course, state: State): ExportPlan {
  return plan([course], state, courseTag(course.name))
}

/**
 * Merge a per-class export into the recorded history without dropping the other classes.
 *
 * Given the class's tag, that class's old rows are replaced rather than added to: the file just
 * saved is the whole truth about that class, so a row it withdrew has to leave the history too.
 * Left in, it would be cancelled again by every export that followed.
 */
export function mergeHistory(previous: ExportedEntry[], added: ExportedEntry[], only?: string): ExportedEntry[] {
  const kept = only ? previous.filter((e) => e.courseTag !== only) : previous
  const byUid = new Map(kept.map((e) => [e.uid, e]))
  for (const e of added) byUid.set(e.uid, e)
  return [...byUid.values()]
}

export function icsForAll(courses: Course[], reminder: Reminder) {
  return buildIcs(courses.map(exportable), reminder)
}

export function icsForCourse(course: Course, reminder: Reminder) {
  return buildIcs([exportable(course)], reminder)
}

export function fileNameFor(course: Course) {
  const slug = course.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${slug || 'class'}.ics`
}
