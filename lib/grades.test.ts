import { describe, it, expect } from 'vitest'
import { extractWeights, gradeSummary, letterFor, mergeWeights, type Weight } from './grades'

const w = (label: string, weight: number, earned?: number): Weight => ({ id: label, label, weight, earned })

describe('extractWeights', () => {
  it('reads a plain grading table', () => {
    const out = extractWeights(`Grading
Participation 10%
Homework 25%
Midterm 25%
Final exam 40%`)
    expect(out.map((r) => [r.label, r.weight])).toEqual([
      ['Participation', 10],
      ['Homework', 25],
      ['Midterm', 25],
      ['Final exam', 40],
    ])
  })

  it('handles dotted leaders and colons', () => {
    const out = extractWeights(`Quizzes.............30%
Papers: 30%
Final ... 40%`)
    expect(out.map((r) => r.label)).toEqual(['Quizzes', 'Papers', 'Final'])
  })

  it('reads the table transposed', () => {
    const out = extractWeights(`50% Exams
50% Projects`)
    expect(out.map((r) => [r.label, r.weight])).toEqual([
      ['Exams', 50],
      ['Projects', 50],
    ])
  })

  it('returns nothing when the percentages do not add up, rather than guessing', () => {
    expect(extractWeights(`Attendance is 95% of success
You need 60% to pass
Roughly 20% of students drop`)).toEqual([])
  })

  it('ignores late policies and letter-grade scales', () => {
    const out = extractWeights(`Homework 40%
Exams 60%
Late work loses 10% per day
A 93% and above
B 83%`)
    expect(out.map((r) => r.label)).toEqual(['Homework', 'Exams'])
  })

  it('needs at least two categories', () => {
    expect(extractWeights('Final exam 100%')).toEqual([])
  })
})

describe('gradeSummary', () => {
  it('reports nothing until a score is entered', () => {
    expect(gradeSummary([w('Exams', 60), w('Homework', 40)]).current).toBeNull()
  })

  it('weights the entered categories against each other', () => {
    // 90 on a 60% category and 70 on a 40% category is 82 across the graded 100%.
    expect(gradeSummary([w('Exams', 60, 90), w('Homework', 40, 70)]).current).toBeCloseTo(82)
  })

  it('scores only the graded portion, not the whole term', () => {
    const s = gradeSummary([w('Midterm', 30, 80), w('Final', 70)])
    expect(s.graded).toBe(30)
    expect(s.current).toBeCloseTo(80)
  })

  it('brackets the outcome between acing and abandoning the rest', () => {
    const s = gradeSummary([w('Midterm', 30, 80), w('Final', 70)])
    expect(s.ceiling).toBeCloseTo(94) // 24 points banked plus a perfect 70
    expect(s.floor).toBeCloseTo(24) // 24 points banked and nothing more
  })

  it('handles a table that does not total 100', () => {
    const s = gradeSummary([w('A', 50, 100), w('B', 30, 50)])
    expect(s.total).toBe(80)
    expect(s.current).toBeCloseTo((50 * 100 + 30 * 50) / 80)
  })
})

describe('letterFor', () => {
  it('uses the common cutoffs', () => {
    expect(letterFor(95)).toBe('A')
    expect(letterFor(90)).toBe('A-')
    expect(letterFor(82.9)).toBe('B-')
    expect(letterFor(59)).toBe('F')
    expect(letterFor(null)).toBe('')
  })
})

describe('mergeWeights', () => {
  it('keeps entered scores for categories that survive a re-read', () => {
    const out = mergeWeights([w('Exams', 60, 88), w('Homework', 40)], [w('Exams', 50), w('Homework', 30), w('Quizzes', 20)])
    expect(out.map((r) => [r.label, r.weight, r.earned])).toEqual([
      ['Exams', 50, 88],
      ['Homework', 30, undefined],
      ['Quizzes', 20, undefined],
    ])
  })

  it('leaves an untouched table to be replaced wholesale', () => {
    const fresh = [w('New', 100)]
    expect(mergeWeights([w('Old', 100)], fresh)).toBe(fresh)
  })

  it('keeps hand-entered categories when a re-read finds no table', () => {
    const mine = [w('Mine', 100, 90)]
    expect(mergeWeights(mine, [])).toBe(mine)
  })
})
