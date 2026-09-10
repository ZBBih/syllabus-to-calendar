// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ExportStep, defaultTab } from './export-step'
import type { State } from '@/lib/store'
import { SITE_URL } from '@/lib/site'
import { courseTag, eventUid } from '@/lib/uid'

afterEach(cleanup)

const base: State = {
  step: 3,
  reminder: '1d',
  activeCourseId: null,
  lastExport: [],
  exportSequence: 0,
  courses: [
    {
      id: 'c1',
      name: 'ECON 101',
      term: { season: 'Fall', year: 2026 },
      text: 'x',
      extracted: true,
      events: [
        { id: 'a', date: '2026-09-14', title: 'Quiz', confidence: 'high', include: true },
        { id: 'b', date: '2026-09-14', title: 'Essay', confidence: 'high', include: true },
      ],
    },
    {
      id: 'c2',
      name: '',
      term: { season: 'Fall', year: 2026 },
      text: 'x',
      extracted: true,
      events: [{ id: 'z', date: '2026-10-01', title: 'Lab', confidence: 'high', include: true }],
    },
  ],
}

describe('defaultTab', () => {
  it('picks Apple on iPhone and Mac, Google elsewhere', () => {
    expect(defaultTab('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('Apple')
    expect(defaultTab('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('Apple')
    expect(defaultTab('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Google')
    expect(defaultTab('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Google')
  })
})

describe('ExportStep', () => {
  it('warns about unnamed classes with dates and offers a way back', () => {
    const dispatch = vi.fn()
    render(<ExportStep state={base} dispatch={dispatch} />)
    expect(screen.getByRole('alert').textContent).toMatch(/one class has no name/i)
    fireEvent.click(screen.getByRole('button', { name: /name it in upload/i }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStep', step: 1 })
  })
  it('names the weekly class time separately so the count matches the review table', () => {
    const withMeeting: State = {
      ...base,
      courses: [
        { ...base.courses[0], meeting: { days: ['MO'], start: '10:00', end: '10:50', firstDate: '2026-08-31', untilDate: '2026-12-04' } },
        base.courses[1],
      ],
    }
    render(<ExportStep state={withMeeting} dispatch={() => {}} />)
    expect(screen.getByText(/2 deadlines plus your weekly class time across 1 class,/i)).toBeTruthy()
  })
  it('shows a clash callout when two things share a day', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    expect(screen.getByText(/one day/i)).toBeTruthy()
  })
  it('counts only named classes in the summary and enables the main call to action', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    expect(screen.getByText(/2 deadlines across 1 class,/i)).toBeTruthy()
    expect((screen.getByRole('button', { name: /add to my calendar/i }) as HTMLButtonElement).disabled).toBe(false)
  })
  it('offers the link once the file is out, and hands it to the share sheet', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true })
    render(<ExportStep state={base} dispatch={() => {}} />)
    // Nothing to pass on until the student has actually got their file.
    expect(screen.queryByRole('button', { name: /send this to a friend/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /add to my calendar/i }))
    fireEvent.click(await screen.findByRole('button', { name: /send this to a friend/i }))
    await Promise.resolve()
    // The link rides inside the text: iOS Messages keeps a url and throws the sentence away.
    const [[arg]] = share.mock.calls
    expect(arg.url).toBeUndefined()
    expect(arg.text).toContain(SITE_URL)
    expect(arg.text).toContain('No account, free.')
  })

  it('copies the link and says so when there is no share sheet', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true })
    render(<ExportStep state={base} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /add to my calendar/i }))
    fireEvent.click(await screen.findByRole('button', { name: /send this to a friend/i }))
    expect(writeText).toHaveBeenCalledWith(SITE_URL)
    expect(await screen.findByText(/link copied/i)).toBeTruthy()
  })

  it('offers to take everything back off when nothing is ticked but a past export exists', () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true, writable: true })
    // The history names the same two events the rows do, so the retraction counts them once.
    const [quiz, essay] = base.courses[0].events
    const none: State = {
      ...base,
      lastExport: [
        { uid: eventUid('ECON 101', quiz), date: quiz.date, summary: 'ECON 101: Quiz' },
        { uid: eventUid('ECON 101', essay), date: essay.date, summary: 'ECON 101: Essay' },
      ],
      courses: base.courses.map((c) => ({ ...c, events: c.events.map((e) => ({ ...e, include: false })) })),
    }
    const dispatch = vi.fn()
    render(<ExportStep state={none} dispatch={dispatch} />)
    expect(screen.getByText(/take it back off your calendar/i)).toBeTruthy()
    expect(screen.getByText(/takes back the 2 events/i)).toBeTruthy()

    const button = screen.getByRole('button', { name: /take them off my calendar/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    // The history is cleared by recording an export of nothing, so the offer does not come back.
    expect(dispatch).toHaveBeenCalledWith({ type: 'recordExport', entries: [] })
  })

  it('still refuses to export when there is nothing to add and nothing to withdraw', () => {
    const empty: State = { ...base, lastExport: [], courses: base.courses.map((c) => ({ ...c, events: [] })) }
    render(<ExportStep state={empty} dispatch={() => {}} />)
    expect(screen.getByText(/nothing to export yet/i)).toBeTruthy()
    expect((screen.getByRole('button', { name: /add to my calendar/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  /*
    The per-class file used to withdraw nothing at all, so a row deleted since the last export
    stayed on the calendar until a full export went out. The export history now records which
    class each row came from, as an opaque tag, so one class can be taken back on its own.
  */
  it('withdraws this class\'s deleted row without touching the other class', async () => {
    const [quiz, essay] = base.courses[0].events
    const psyc = { ...base.courses[1], name: 'PSYC 200' }
    const paper = psyc.events[0]
    // Both classes went out last time. ECON has since lost its essay.
    const state: State = {
      ...base,
      exportSequence: 1,
      courses: [{ ...base.courses[0], events: [quiz] }, psyc],
      lastExport: [
        { uid: eventUid('ECON 101', quiz), date: quiz.date, summary: 'ECON 101: Quiz', courseTag: courseTag('ECON 101') },
        { uid: eventUid('ECON 101', essay), date: essay.date, summary: 'ECON 101: Essay', courseTag: courseTag('ECON 101') },
        { uid: eventUid('PSYC 200', paper), date: paper.date, summary: 'PSYC 200: Lab', courseTag: courseTag('PSYC 200') },
      ],
    }
    const blobs: Blob[] = []
    Object.assign(URL, { createObjectURL: vi.fn((b: Blob) => { blobs.push(b); return 'blob:x' }), revokeObjectURL: vi.fn() })
    const dispatch = vi.fn()
    render(<ExportStep state={state} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /just one class/i }))
    fireEvent.click(screen.getByRole('button', { name: 'ECON 101' }))

    const ics = await blobs[0].text()
    expect(ics).toContain('STATUS:CANCELLED')
    expect(ics).toContain(`UID:${eventUid('ECON 101', essay)}`)
    // The other class was not in this file, so nothing of its own may appear in it.
    expect(ics).not.toContain(`UID:${eventUid('PSYC 200', paper)}`)

    // And the history drops the withdrawn row while keeping the other class, so the next
    // export does not cancel it a second time.
    const recorded = dispatch.mock.calls.find((c) => c[0].type === 'recordExport')?.[0].entries as State['lastExport']
    expect(recorded.map((e) => e.uid)).toContain(eventUid('PSYC 200', paper))
    expect(recorded.map((e) => e.uid)).not.toContain(eventUid('ECON 101', essay))
  })

  it('downloads one class from the menu using a slug file name', () => {
    const state: State = { ...base, courses: [base.courses[0], { ...base.courses[1], name: 'PSYC 200' }] }
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    render(<ExportStep state={state} dispatch={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /just one class/i }))
    fireEvent.click(screen.getByRole('button', { name: 'PSYC 200' }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/psyc-200\.ics is in your downloads/i)).toBeTruthy()
  })
})

describe('ExportStep per-class menu', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: /just one class/i }))
  const isOpen = () => screen.getByRole('button', { name: /just one class/i }).getAttribute('aria-expanded') === 'true'

  it('closes on Escape', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    open()
    expect(isOpen()).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(isOpen()).toBe(false)
  })

  it('closes when something outside it is tapped, which is the only route on a phone', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    open()
    fireEvent.pointerDown(document.body)
    expect(isOpen()).toBe(false)
  })

  it('stays open while the pointer is inside it, so picking a class still works', () => {
    render(<ExportStep state={base} dispatch={() => {}} />)
    open()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'ECON 101' }))
    expect(isOpen()).toBe(true)
  })
})
