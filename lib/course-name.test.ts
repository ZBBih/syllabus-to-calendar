import { describe, it, expect } from 'vitest'
import { nameFromFileName } from './course-name'

describe('nameFromFileName', () => {
  it('writes a department code in capitals', () => {
    expect(nameFromFileName('biol-210-syllabus.docx')).toBe('BIOL 210')
    expect(nameFromFileName('cs61a fall 2026.pdf')).toBe('CS 61A')
  })
  it('strips extension, separators, syllabus words, seasons, years, and copy markers', () => {
    expect(nameFromFileName('ECON101_Fall26_syllabus (1).pdf')).toBe('ECON 101')
    expect(nameFromFileName('PSYC-200-Syllabus-Spring-2027.docx')).toBe('PSYC 200')
    expect(nameFromFileName('Intro to Philosophy syllabus F26.pdf')).toBe('Intro to Philosophy')
  })
  it('falls back to the cleaned stem when everything is stripped', () => {
    expect(nameFromFileName('syllabus.pdf')).toBe('')
  })
  it('keeps ordinary names and course numbers intact', () => {
    expect(nameFromFileName('Organic Chemistry II.pdf')).toBe('Organic Chemistry II')
    expect(nameFromFileName('MATH 21 syllabus 2026.pdf')).toBe('MATH 21')
  })
})
