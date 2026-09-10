import { describe, it, expect } from 'vitest'
import { extractWeights, gradeSummary, letterFor, mergeWeights, type Weight } from './grades'

const w = (label: string, weight: number, earned?: number): Weight => ({ id: label, label, weight, earned })

describe('extractWeights', () => {
  it('reads a breakdown written as one sentence', () => {
    const w = extractWeights('BIOL 210\nGrading: Problem sets 20%, Quizzes 15%, Midterm 25%, Final paper 15%, Final exam 25%\n')
    expect(w.map((x) => [x.label, x.weight])).toEqual([
      ['Problem sets', 20],
      ['Quizzes', 15],
      ['Midterm', 25],
      ['Final paper', 15],
      ['Final exam', 25],
    ])
  })
  it('keeps a number that belongs to the label', () => {
    const w = extractWeights('Exam 1 25%; Exam 2 25%; Final 50%')
    expect(w.map((x) => x.label)).toEqual(['Exam 1', 'Exam 2', 'Final'])
  })
  it('reads a sentence joined by and', () => {
    const w = extractWeights('Your grade is coursework 60% and the final exam 40%.')
    expect(w.reduce((n, x) => n + x.weight, 0)).toBe(100)
  })
  it('ignores a letter-grade scale written inline', () => {
    expect(extractWeights('Grades: A 93%, B 83%, C 73%, D 63%')).toEqual([])
    expect(extractWeights('A 93%, B 83%, C 73%, D 63%')).toEqual([])
  })
  it('ignores an inline list of percentages that is not a breakdown', () => {
    expect(extractWeights('Attendance is 95% expected and participation matters 12% of the time')).toEqual([])
  })
  it('drops a late penalty mentioned alongside real categories', () => {
    const w = extractWeights('Homework 40%, Exams 60%\nLate work loses 10% per day')
    expect(w.map((x) => x.label)).toEqual(['Homework', 'Exams'])
  })

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

  /**
   * A real syllabus (UCF MAR3613) ends its grading table with "Total 1000 100%". Counting that
   * row as a category doubled the sum, the sum guard threw the whole table away, and the grade
   * calculator never appeared for a syllabus that plainly had one.
   */
  it('ignores the total row of a grading table', () => {
    const text = [
      'Grading Elements Points Percentages',
      'Class Attendance and Participation 150 15%',
      'In Class Case Studies 100 10%',
      'Midterm I 150 15%',
      'Midterm II 200 20%',
      'Group Projects 400 40%',
      'Total 1000 100%',
    ].join('\n')
    const w = extractWeights(text)
    expect(w.map((x) => [x.label, x.weight])).toEqual([
      ['Class Attendance and Participation', 15],
      ['In Class Case Studies', 10],
      ['Midterm I', 15],
      ['Midterm II', 20],
      ['Group Projects', 40],
    ])
  })
})
