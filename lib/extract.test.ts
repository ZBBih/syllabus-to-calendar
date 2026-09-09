import { describe, it, expect } from 'vitest'
import { extractEvents, readReport, termReferenceDate, type Term } from './extract'

const fall: Term = { season: 'Fall', year: 2026 }
const spring: Term = { season: 'Spring', year: 2027 }

describe('termReferenceDate', () => {
  it('fall starts mid August', () => {
    expect(termReferenceDate(fall).toISOString().slice(0, 10)).toBe('2026-08-15')
  })
})

describe('extractEvents', () => {
  it('bulleted line', () => {
    const [e] = extractEvents('- Sept 14: Midterm 1', fall)
    expect(e).toMatchObject({ date: '2026-09-14', title: 'Midterm 1', confidence: 'high' })
    expect(e.time).toBeUndefined()
  })

  it('tab separated with weekday', () => {
    const [e] = extractEvents('Mon Oct 5\tQuiz 2\tCh 4', fall)
    expect(e).toMatchObject({ date: '2026-10-05', title: 'Quiz 2 Ch 4' })
  })

  it('prose with a time', () => {
    const [e] = extractEvents('The final exam will be held on December 12 at 2pm in Room 4.', fall)
    expect(e).toMatchObject({ date: '2026-12-12', time: '14:00', confidence: 'high' })
  })

  it('picks up a time that chrono parses separately', () => {
    const [e] = extractEvents('Oct 12: Midterm exam at 2pm', fall)
    expect(e).toMatchObject({ date: '2026-10-12', time: '14:00', title: 'Midterm exam' })
  })

  it('date-only line takes next line as title', () => {
    const [e] = extractEvents('Nov 3\nEssay due', fall)
    expect(e).toMatchObject({ date: '2026-11-03', title: 'Essay due', confidence: 'low', reason: 'date only' })
  })

  it('spring term resolves into the spring year', () => {
    const [e] = extractEvents('Feb 2 – Problem set 1', spring)
    expect(e).toMatchObject({ date: '2027-02-02', title: 'Problem set 1' })
  })

  it('ignores phone numbers and bare years', () => {
    expect(extractEvents('Call 555-1234\nUpdated 2026\nOffice: Room 12', fall)).toEqual([])
  })

  it('dedupes and sorts', () => {
    const out = extractEvents('Oct 9: Quiz\nSept 1: Intro\nOct 9: Quiz', fall)
    expect(out.map((e) => e.date)).toEqual(['2026-09-01', '2026-10-09'])
  })

  it('ignores a leading Week N so the number is not read as a day or year', () => {
    const out = extractEvents('Week 3  Sept 16  Quiz 1 (chapters 1-3)\nWeek 7 Oct 14 Midterm exam, 10am, Room 204', fall)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ date: '2026-09-16', title: 'Quiz 1 (chapters 1-3)' })
    expect(out[1]).toMatchObject({ date: '2026-10-14', time: '10:00', title: 'Midterm exam, Room 204' })
  })

  it('date range is one event carrying its last day', () => {
    const [e, ...rest] = extractEvents('Sept 14-16: Field trip', fall)
    expect(e).toMatchObject({ date: '2026-09-14', endDate: '2026-09-16' })
    expect(rest).toEqual([])
  })

  it('a single date carries no end date', () => {
    const [e] = extractEvents('Sept 14: Field trip', fall)
    expect(e.endDate).toBeUndefined()
  })

  it('every date on a line becomes its own row', () => {
    const out = extractEvents('Sept 9 / Sept 11 \u2014 Reading response 1 due', fall)
    expect(out.map((e) => e.date)).toEqual(['2026-09-09', '2026-09-11'])
    expect(out.every((e) => e.title === 'Reading response 1 due')).toBe(true)
  })

  it('drops the joiner left behind between two dates', () => {
    const out = extractEvents('Oct 5 and Oct 7: Group presentations', fall)
    expect(out.map((e) => e.title)).toEqual(['Group presentations', 'Group presentations'])
  })

  it('a date repeated on one line still makes one row', () => {
    const out = extractEvents('Oct 9 quiz, submit by Oct 9', fall)
    expect(out).toHaveLength(1)
  })

  it('a second date outside the term window does not sink the first', () => {
    const out = extractEvents('Sept 9 essay due, syllabus written Jan 3 2020', fall)
    expect(out.map((e) => e.date)).toEqual(['2026-09-09'])
  })
})

describe('readReport', () => {
  it('keeps every line of the syllabus, in order', () => {
    const out = readReport('Course schedule\nSept 14: Midterm\nOffice: Room 12', fall)
    expect(out.map((l) => l.text)).toEqual(['Course schedule', 'Sept 14: Midterm', 'Office: Room 12'])
  })

  it('marks the line a date was taken from', () => {
    const [, line] = readReport('Course schedule\nSept 14: Midterm 1', fall)
    expect(line.captured).toEqual([{ date: '2026-09-14', endDate: undefined, time: undefined, title: 'Midterm 1' }])
    expect(line.skipped).toEqual([])
  })

  it('reports a date it found but left out of the term, with the date it would have used', () => {
    const [line] = readReport('May 4: Final exam', fall)
    expect(line.captured).toEqual([])
    expect(line.skipped).toEqual([{ text: 'May 4', date: '2027-05-04', reason: 'outside the term', title: 'Final exam' }])
  })

  it('reports a date too vague to use', () => {
    const [line] = readReport('Essays are due in November', fall)
    expect(line.captured).toEqual([])
    expect(line.skipped[0].reason).toBe('no month and day')
    expect(line.skipped[0].date).toBeUndefined()
  })

  it('does not report the time on a captured line as something lost', () => {
    const [line] = readReport('Oct 12: Midterm exam at 2pm', fall)
    expect(line.captured).toHaveLength(1)
    expect(line.skipped).toEqual([])
  })

  it('says nothing was missed on a line that carries no date at all', () => {
    const [year, phone] = readReport('Updated 2026\nCall 555-1234', fall)
    expect(year.skipped).toEqual([])
    expect(phone.skipped).toEqual([])
  })

  it('credits a date-only line with the row it produced', () => {
    const out = readReport('Nov 3\nEssay due', fall)
    expect(out[0].captured.map((c) => c.title)).toEqual(['Essay due'])
    expect(out[1].captured).toEqual([])
  })

  it('agrees with what extraction actually produced', () => {
    const text = 'Week 1  Sept 2  Welcome\nMay 4: Final exam\nOct 20-21 Fall break'
    const captured = readReport(text, fall).flatMap((l) => l.captured.map((c) => c.date))
    expect(captured).toEqual(extractEvents(text, fall).map((e) => e.date))
  })
})


/**
 * Reported from a real UCF syllabus on 2026-09-08: 43 events, of which several carried an
 * entire policy paragraph as their title, dated to the first week of term. Both causes are
 * here.
 */
describe('prose is not a schedule', () => {
  const policy =
    'I will not change deadlines. You will get 30% points for delayed submissions up to 3 days. Submissions delayed beyond 3 days will have no points awarded.'

  it('a length of time is not a date, however confident chrono is about it', () => {
    // "3 days" counted from the term reference lands on a real date with month and day both
    // marked certain, which is why it got through. Nothing on a syllabus is scheduled as a
    // bare duration.
    expect(extractEvents(policy, fall)).toEqual([])
    expect(extractEvents('Please reply within 24 hours of the announcement.', fall)).toEqual([])
    expect(extractEvents('You have two weeks to appeal a grade.', fall)).toEqual([])
  })

  it('says in the read report why the duration was passed over', () => {
    const [line] = readReport(policy, fall)
    expect(line.captured).toEqual([])
    expect(line.skipped.map((s) => s.reason)).toContain('a length of time, not a date')
  })

  it('still reads a real date out of a sentence that also contains a duration', () => {
    const [e] = extractEvents('The final is on Dec 10, and regrades close 3 days later.', fall)
    expect(e).toMatchObject({ date: '2026-12-10' })
  })

  it('a paragraph that does carry a real date is cut down to a usable title', () => {
    const long =
      'Dec 10: the final exam will be held in the testing center and you must bring a photo ID, a pencil and an approved calculator, and you should arrive fifteen minutes early because late entry is not permitted under any circumstances whatsoever.'
    const [e] = extractEvents(long, fall)
    expect(e.title.length).toBeLessThanOrEqual(121)
    expect(e.title.endsWith('…')).toBe(true)
    expect(e.confidence).toBe('low')
    // The whole line survives as the source, so nothing the student needs is thrown away.
    expect(e.source).toContain('late entry is not permitted')
  })

  it('leaves an ordinary title alone', () => {
    const [e] = extractEvents('Sept 14: Quiz 1 (chapters 1-3)', fall)
    expect(e).toMatchObject({ title: 'Quiz 1 (chapters 1-3)', confidence: 'high' })
  })
})
