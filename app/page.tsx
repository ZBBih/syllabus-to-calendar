'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { CourseCard } from '@/components/course-card'
import { ReviewTable } from '@/components/review-table'
import { DownloadPanel } from '@/components/download-panel'
import { DatePreview } from '@/components/date-preview'
import { FileDrop } from '@/components/file-drop'
import { StepHeading } from '@/components/step-heading'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { initialState, load, reducer, save } from '@/lib/store'
import { nameFromFileName } from '@/lib/course-name'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const hydrated = useRef(false)
  const [storageBlocked, setStorageBlocked] = useState(false)

  useEffect(() => {
    const saved = load()
    if (saved) dispatch({ type: 'hydrate', state: saved })
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const ok = save(state)
    setStorageBlocked(!ok)
  }, [state])

  const reviewable = state.courses.filter((c) => c.extracted)
  const extractable = state.courses.filter((c) => c.text.trim()).length
  const empty = state.courses.length === 1 && !state.courses[0].name && !state.courses[0].text

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={40} className="pop" />
          <span className="font-display text-2xl font-black tracking-tight">Syllabify</span>
        </div>
        <ThemeToggle />
      </header>

      <section className="mb-12 text-center">
        <h1 className="rise font-display text-4xl font-black tracking-tight sm:text-5xl">
          Syllabify your <span className="text-accent-strong">semester</span>.
        </h1>
        <p className="rise mx-auto mt-4 max-w-xl text-lg text-muted" style={{ animationDelay: '60ms' }}>
          Drop your syllabi. Get every deadline on your calendar. No account, nothing uploaded, done in a minute.
        </p>
      </section>

      {storageBlocked && (
        <div role="alert" className="pop mb-6 rounded-2xl border border-accent bg-accent-soft p-4 text-sm">
          <strong>Your browser is blocking saving.</strong> Your classes will vanish if you close this tab, so download your file before you go.
        </div>
      )}

      <section className="mb-12">
        <StepHeading n={1} title="Your classes" hint="Each file becomes a class with its dates found automatically." />
        <FileDrop
          multiple
          hero
          className="rise mb-3"
          onFiles={(files) =>
            dispatch({ type: 'addFromFiles', files: files.map((f) => ({ name: nameFromFileName(f.fileName), text: f.text })) })
          }
        />
        {empty && (
          <p className="mb-5 text-center text-sm text-muted">
            No syllabus handy?{' '}
            <button
              type="button"
              onClick={() => dispatch({ type: 'addFromFiles', files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT }] })}
              className="font-semibold text-accent-strong underline decoration-2 underline-offset-2 hover:opacity-80"
            >
              Try a sample
            </button>
          </p>
        )}
        <div className="space-y-4">
          {state.courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} canRemove={state.courses.length > 1} dispatch={dispatch} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => dispatch({ type: 'add' })} className="btn btn-secondary">
            + Add another class
          </button>
          {extractable > 1 && (
            <button type="button" onClick={() => dispatch({ type: 'extractAll' })} className="btn btn-primary">
              Find dates for all classes
            </button>
          )}
        </div>
      </section>

      <section className="mb-12">
        <StepHeading n={2} title="Check the dates" hint="Fix anything amber, uncheck what you don't want, add what we missed." />
        {reviewable.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">Nothing here yet. Drop a syllabus above and this fills itself in.</div>
        ) : (
          <div className="space-y-4">
            {reviewable.map((c) => (
              <ReviewTable key={c.id} course={c} dispatch={dispatch} />
            ))}
            {reviewable.length > 1 && <DatePreview courses={state.courses} />}
          </div>
        )}
      </section>

      <section className="mb-12">
        <StepHeading n={3} title="Put it on your calendar" hint="One file, every class, one import." />
        <DownloadPanel courses={state.courses} reminder={state.reminder} dispatch={dispatch} />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
        <span>Everything stays in this browser. Nothing is uploaded anywhere.</span>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all classes and dates?')) dispatch({ type: 'clear' })
          }}
          className="underline hover:text-danger"
        >
          Start over
        </button>
      </footer>
    </main>
  )
}
