'use client'

import { useState, type Dispatch } from 'react'
import { extractEvents, SEASONS, type Season } from '@/lib/extract'
import type { Action, Course } from '@/lib/store'
import { FileDrop } from './file-drop'

const thisYear = new Date().getFullYear()
const YEARS = [thisYear - 1, thisYear, thisYear + 1]

export function CourseCard({
  course,
  index,
  canRemove,
  dispatch,
}: {
  course: Course
  index: number
  canRemove: boolean
  dispatch: Dispatch<Action>
}) {
  const [touched, setTouched] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const nameMissing = course.name.trim() === ''
  const canExtract = !nameMissing && course.text.trim() !== ''

  function findDates() {
    const events = extractEvents(course.text, course.term)
    dispatch({ type: 'setEvents', id: course.id, events })
    setNotice(
      events.length === 0
        ? 'No dates found. Check the term and try pasting just the schedule section.'
        : `Found ${events.length} date${events.length === 1 ? '' : 's'}. Review them in step 2.`,
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Class {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'remove', id: course.id })}
            className="text-sm text-zinc-500 hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="block text-sm">
          <span className="font-medium">Class name</span>
          <input
            value={course.name}
            onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { name: e.target.value } })}
            onBlur={() => setTouched(true)}
            placeholder="e.g. ECON 101"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
          {touched && nameMissing && <span className="text-xs text-red-600">Required. It becomes the prefix on every event.</span>}
          {!nameMissing && (
            <span className="text-xs text-zinc-500">Events will look like “{course.name.trim()}: Midterm”</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="font-medium">Term</span>
          <select
            value={course.term.season}
            onChange={(e) =>
              dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, season: e.target.value as Season } } })
            }
            className="mt-1 block rounded-md border border-zinc-300 px-3 py-2"
          >
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Year</span>
          <select
            value={course.term.year}
            onChange={(e) =>
              dispatch({ type: 'update', id: course.id, patch: { term: { ...course.term, year: Number(e.target.value) } } })
            }
            className="mt-1 block rounded-md border border-zinc-300 px-3 py-2"
          >
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <FileDrop
          onText={(text) => {
            dispatch({ type: 'update', id: course.id, patch: { text } })
            setNotice('File converted to text. Check it below, then click Find dates.')
          }}
        />
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium">Syllabus text</span>
        <textarea
          value={course.text}
          onChange={(e) => dispatch({ type: 'update', id: course.id, patch: { text: e.target.value } })}
          placeholder="Or paste your syllabus here. The schedule section is all it needs."
          rows={8}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={findDates}
          disabled={!canExtract}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Find dates
        </button>
        {!canExtract && <span className="text-xs text-zinc-500">Add a class name and some syllabus text first.</span>}
        {notice && canExtract && <span className="text-sm text-zinc-700">{notice}</span>}
      </div>
    </div>
  )
}
