import { buildIcs, type Reminder } from './ics'
import type { Course } from './store'

import type { CalendarEvent } from './ics'

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

/** Courses that have exportable rows but no name; they would otherwise vanish from the file. */
export function unnamedWithEvents(courses: Course[]) {
  return courses.filter((c) => !c.name.trim() && exportableEvents(c).length > 0)
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
