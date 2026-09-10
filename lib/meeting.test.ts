import { describe, it, expect } from 'vitest'
import { detectMeeting } from './meeting'

const fall = { season: 'Fall' as const, year: 2026 }

describe('detectMeeting', () => {
  it('reads compact day codes with a time range and room', () => {
    const m = detectMeeting('ECON 101\nMWF 10:00-10:50 in Olin 204\nInstructor: X', fall)!
    expect(m).toMatchObject({ days: ['MO', 'WE', 'FR'], start: '10:00', end: '10:50', location: 'Olin 204' })
    expect(m.firstDate).toBe('2026-08-17')
    expect(m.untilDate).toBe('2026-12-05')
  })
  it('reads spelled-out days with pm times', () => {
    const m = detectMeeting('Class meets Tuesdays and Thursdays, 2:00–3:15 pm, Room 12', fall)!
    expect(m).toMatchObject({ days: ['TU', 'TH'], start: '14:00', end: '15:15', location: 'Room 12' })
  })
  it('keeps the building name with the room number', () => {
    const m = detectMeeting('BIOL 210\nLecture: Tuesday and Thursday 9:30-10:45am, Science Hall 118', fall)!
    expect(m.location).toBe('Science Hall 118')
  })
  it('handles TR and a single meridiem', () => {
    const m = detectMeeting('Lecture: TR 9:30-10:45am', fall)!
    expect(m).toMatchObject({ days: ['TU', 'TH'], start: '09:30', end: '10:45' })
  })
  it('returns null when there is no weekly pattern', () => {
    expect(detectMeeting('Sept 14: Quiz 1\nOct 12: Midterm at 2pm', fall)).toBeNull()
  })

  /**
   * A real syllabus (UCF MAR3613) labels the row "Class Hours" and puts the days and the times
   * on the two lines under it, so requiring both on one line found no meeting at all and the
   * student lost their recurring class.
   */
  it('reads a meeting whose days and times are on separate lines', () => {
    const m = detectMeeting('MAR3613 Marketing Research\nSemester: Fall 2026\nClass Hours\nTuesdays & Thursdays\n12pm-1:15pm', fall)!
    expect(m).toMatchObject({ days: ['TU', 'TH'], start: '12:00', end: '13:15' })
  })

  it('does not take office hours for the class meeting', () => {
    const m = detectMeeting('BIOL 210\nOffice Hours: Mondays 9:00-10:00\nClass: Tuesdays and Thursdays 2:00-3:15 pm', fall)!
    expect(m).toMatchObject({ days: ['TU', 'TH'], start: '14:00', end: '15:15' })
  })

  /**
   * From a second real syllabus (UCF MAR 4418). The header labels each field on its own line
   * and writes a Monday class as the single letter M, which nothing recognised, so the first
   * time range in the document won — the professor's office hours, on the line under their
   * label. The student got a weekly 4:45pm event that is not their class, fifteen times.
   */
  it('reads a one-day class written as a single letter after the label', () => {
    const text = [
      'Course Information',
      'Term: Fall 2026',
      'Class Meeting Days: M',
      'Class Meeting Time: 06:00PM - 08:50PM',
      'Class Meeting Location: BA2 0210',
    ].join('\n')
    expect(detectMeeting(text, fall)).toMatchObject({ days: ['MO'], start: '18:00', end: '20:50' })
  })

  it('does not take office hours listed under their own heading', () => {
    const text = ['Office Hours', 'Mondays 4:45 pm - 5:45 pm', '', 'Wednesdays 9:45 am - 11:45 am'].join('\n')
    expect(detectMeeting(text, fall)).toBeNull()
  })
})
