import { describe, it, expect } from 'vitest'
import { looksLikeCode, nameFromFileName, nameFromText } from './course-name'

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

describe('nameFromText', () => {
  it('takes a course code from the opening lines', () => {
    expect(nameFromText('PSYC 101: Introduction to Psychology\nFall 2026')).toBe('PSYC 101')
    expect(nameFromText('Course Syllabus\nPHIL 210 Introduction to Philosophy')).toBe('PHIL 210')
  })

  it('falls back to the first real line when there is no code', () => {
    expect(nameFromText('Introduction to Philosophy\nSpring 2027\nDr Smith')).toBe('Introduction to Philosophy')
  })

  it('skips a bare Syllabus heading when looking for the fallback', () => {
    expect(nameFromText('SYLLABUS\nOrganic Chemistry II\nDr Smith')).toBe('Organic Chemistry II')
  })

  it('returns nothing for text with no usable opening', () => {
    expect(nameFromText('')).toBe('')
    expect(nameFromText('   \n\n  ')).toBe('')
  })
})

describe('looksLikeCode', () => {
  it('recognises a department and number', () => {
    expect(looksLikeCode('CHEM 120')).toBe(true)
    expect(looksLikeCode('cs61a')).toBe(true)
  })
  it('refuses what a camera or a scanner names a file', () => {
    expect(looksLikeCode('IMG 4821')).toBe(false)
    expect(looksLikeCode('PXL 20260907')).toBe(false)
    expect(looksLikeCode('scan 003')).toBe(false)
  })
  it('refuses anything that is not a code at all', () => {
    expect(looksLikeCode('Introduction to Philosophy')).toBe(false)
    expect(looksLikeCode('')).toBe(false)
  })
})

