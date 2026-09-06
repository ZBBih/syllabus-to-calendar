import { describe, it, expect } from 'vitest'
import { fileNameFor, icsForCourse, icsForAll } from './export'
import type { Course } from './store'

const c = (name: string, title: string): Course => ({
  id: name,
  name,
  term: { season: 'Fall', year: 2026 },
  text: '',
  events: [{ id: `${name}-1`, date: '2026-09-14', title, confidence: 'high', include: true }],
  extracted: true,
})

describe('export', () => {
  it('per-class file name is a slug', () => {
    expect(fileNameFor(c('ECON 101', 'x'))).toBe('econ-101.ics')
    expect(fileNameFor(c('  ', 'x'))).toBe('class.ics')
  })
  it('per-class file holds only that class', () => {
    const out = icsForCourse(c('ECON 101', 'Quiz'), '1d')
    expect(out).toContain('SUMMARY:ECON 101: Quiz')
    expect(out.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })
  it('combined file holds every class', () => {
    const out = icsForAll([c('A', 'a'), c('B', 'b')], 'none')
    expect(out.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(out).not.toContain('VALARM')
  })
})
