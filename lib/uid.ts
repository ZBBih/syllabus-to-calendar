import type { CalendarEvent } from './ics'

/**
 * Calendar identity for an event, derived from its content rather than a random id.
 *
 * This is what makes a second export update the calendar instead of duplicating it.
 * Google, Apple and Outlook all match an imported VEVENT to an existing one by UID, so the
 * same syllabus processed again (in a new browser, on another laptop, after Start over) has
 * to produce the same UID or the student ends up with two of everything.
 *
 * The hash is taken over what extraction originally found, not what the row says now, so
 * renaming a title or correcting a date updates the existing calendar entry rather than
 * orphaning it and creating a new one.
 */

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** 64 bits of hash as hex, from two passes over the string in opposite directions. */
export function hash(s: string): string {
  const forward = fnv1a(s)
  const backward = fnv1a([...s].reverse().join(''))
  return forward.toString(16).padStart(8, '0') + backward.toString(16).padStart(8, '0')
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export const UID_DOMAIN = 'syllabify.app'

export function eventUid(courseName: string, e: Pick<CalendarEvent, 'date' | 'title' | 'origDate' | 'origTitle'>): string {
  const seed = `${norm(courseName)} ${e.origDate ?? e.date} ${norm(e.origTitle ?? e.title)}`
  return `${hash(seed)}@${UID_DOMAIN}`
}

export function meetingUid(courseName: string): string {
  return `${hash(`meeting ${norm(courseName)}`)}@${UID_DOMAIN}`
}
