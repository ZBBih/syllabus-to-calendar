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

/**
 * The second half of the same real syllabus, reported 2026-09-08 after the duration fix cut it
 * from 43 rows to 38. The three that remained were schedule-table rows whose Notes column held
 * a page of boilerplate: PDF text extraction puts the date cell and the notes cell on one line,
 * so the date is real and the title is not.
 */
describe('a row whose title is boilerplate does not export itself', () => {
  const tableRow =
    '08/15/2026 9:00 AM Notes: This material is available through first day access if you opt in. You should be able to see the course materials on the right-side panel on Canvas. When you click the Stukent link in Canvas for the first time you will be prompted to type in your proof of purchase.'

  it('keeps the row and its real date, but leaves it unticked', () => {
    const [e] = extractEvents(tableRow, fall)
    expect(e.date).toBe('2026-08-15')
    expect(e.confidence).toBe('low')
    expect(e.reason).toBe('the line reads as a paragraph, not a schedule row')
    // Visible, correctable, and one tap from being included — but not on the calendar by
    // default, because "nothing reaches your calendar until you say so" is the whole promise.
    expect(e.include).toBe(false)
  })

  it('leaves every other kind of row ticked, including the ones that only need a look', () => {
    const rows = extractEvents('Sept 14: Quiz 1\nOct 2\nStrengthen Your Skills: 5', fall)
    expect(rows.every((e) => e.include !== false)).toBe(true)
    expect(rows.some((e) => e.reason === 'date only')).toBe(true)
  })
})

/**
 * Every case here came from one real syllabus (UCF MAR3613, Fall 2026), which produced 52 rows
 * of which 22 were sentences from the prose. The dates are genuine text in the document; what
 * was wrong was reading an English phrase, a fraction and a group size as times and dates.
 */
describe('extractEvents on prose that only looks dated', () => {
  it('does not read the word now as a deadline', () => {
    const line = 'As Eric Schmidt famously observed, "Every two days, we now create as much data as we did from the dawn of civilization up until 2003."'
    expect(extractEvents(line, fall)).toEqual([])
  })

  it('does not read "the end of the day" as a second deadline', () => {
    const line = 'Checkpoint 2: Progress Report (Due by the end of the day on 09/13; Submitted to the assignment of Canvas)'
    const out = extractEvents(line, fall)
    expect(out.map((e) => e.date)).toEqual(['2026-09-13'])
  })

  it('does not read a fraction inside an equation as a date', () => {
    const line = 'If your peer evaluation is 10 out of 10, your final score remains 400 × 10/10 = 400, which is a perfect score.'
    expect(extractEvents(line, fall)).toEqual([])
  })

  it('does not read a group size as the time something is due', () => {
    const line = 'Checkpoint 1: Group Formation (Due by the end of the class on 08/27). Form groups of 4–6 students and submit a name.'
    const [e] = extractEvents(line, fall)
    expect(e.date).toBe('2026-08-27')
    expect(e.time).toBeUndefined()
  })

  it('does not read a lecture number as the time a class starts', () => {
    const [e] = extractEvents('11/03 Lecture 12-1Association I Chapter 13 Data Analysis', fall)
    expect(e.date).toBe('2026-11-03')
    expect(e.time).toBeUndefined()
  })

  it('still reads a real time written as a clock', () => {
    const [e] = extractEvents('Sept 30 Research proposal due at 11:59pm', fall)
    expect(e.time).toBe('23:59')
  })

  /**
   * A sentence that mentions a deadline is worth offering, because the date in it is real and
   * the student may want it. It is not worth ticking: 22 of these arriving pre-approved is how
   * a paragraph of a syllabus ends up on a calendar.
   */
  it('offers a deadline buried in a sentence without ticking it', () => {
    // Deliberately under the length at which a line is already treated as a paragraph: the
    // rows this missed on the real syllabus ran 90 to 110 characters, so length alone let
    // every one of them through pre-ticked.
    const line = 'Checkpoint 3: Questionnaire Design (Due by the end of the day on 09/30; Submitted to the discussion board)'
    const [e] = extractEvents(line, fall)
    expect(e.title.length).toBeLessThan(120)
    expect(e.date).toBe('2026-09-30')
    expect(e.include).toBe(false)
    expect(e.confidence).toBe('low')
  })

  /**
   * Only the spans that actually became the row's date or time are cut out of the title. A
   * lecture numbered 12-1 was being removed as if it were a time, leaving "Lecture Association
   * I" on the calendar, and a refused phrase left a hole mid-sentence: "Due by the end of on".
   */
  it('keeps a number in the title when it was refused as a time', () => {
    const [e] = extractEvents('11/03 Lecture 12-1Association I Chapter 13', fall)
    expect(e.title).toContain('12-1')
  })

  it('leaves no hole where a phrase was refused as a date', () => {
    const [e] = extractEvents('Checkpoint 2: Progress Report (Due by the end of the day on 09/13)', fall)
    expect(e.title).toContain('the end of the day on')
  })

  it('does not leave half a date range sitting in the title', () => {
    const [e] = extractEvents('10/05 Monday – 10/09 Friday Lectures 1-7', fall)
    expect(e.date).toBe('2026-10-05')
    expect(e.title).toBe('Lectures 1-7')
  })

  it('leaves a short schedule row ticked even when the date sits inside it', () => {
    const [e] = extractEvents('Quiz 1 on Sept 14 in class', fall)
    expect(e.include).toBe(true)
    expect(e.confidence).toBe('high')
  })

  it('leaves a table row ticked when the date leads it', () => {
    const [e] = extractEvents('08/25 Lecture 01-1 Administrative Details Chapter 1 Group Formation', fall)
    expect(e.include).toBe(true)
    expect(e.confidence).toBe('high')
  })
})
