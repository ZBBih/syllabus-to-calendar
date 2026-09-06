import { buildIcs, type Reminder } from './ics'
import type { Course } from './store'

export function exportable(c: Course) {
  return { name: c.name.trim(), events: c.events.filter((e) => e.include !== false && e.date && e.title.trim()) }
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
