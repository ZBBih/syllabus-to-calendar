'use client'

import { useEffect, useReducer, useRef } from 'react'
import { CourseCard } from '@/components/course-card'
import { ReviewTable } from '@/components/review-table'
import { DownloadPanel } from '@/components/download-panel'
import { initialState, load, reducer, save } from '@/lib/store'

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const hydrated = useRef(false)

  useEffect(() => {
    const saved = load()
    if (saved) dispatch({ type: 'hydrate', state: saved })
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (hydrated.current) save(state)
  }, [state])

  const reviewable = state.courses.filter((c) => c.extracted)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Syllabus to Calendar</h1>
        <p className="mt-2 text-zinc-600">
          Paste or upload each syllabus, check the dates it finds, and download one file that drops every deadline into
          your calendar. Nothing leaves your browser and there is nothing to sign up for.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">1. Your classes</h2>
        <div className="space-y-4">
          {state.courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} canRemove={state.courses.length > 1} dispatch={dispatch} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'add' })}
          className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          + Add another class
        </button>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">2. Review dates</h2>
        {reviewable.length === 0 ? (
          <p className="text-sm text-zinc-500">Click “Find dates” on a class above and its events will show here.</p>
        ) : (
          <div className="space-y-4">
            {reviewable.map((c) => (
              <ReviewTable key={c.id} course={c} dispatch={dispatch} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">3. Download and import</h2>
        <DownloadPanel courses={state.courses} />
      </section>

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-500">
        Your classes are saved in this browser only.{' '}
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all classes and dates?')) dispatch({ type: 'clear' })
          }}
          className="underline hover:text-red-600"
        >
          Clear everything
        </button>
      </footer>
    </main>
  )
}
