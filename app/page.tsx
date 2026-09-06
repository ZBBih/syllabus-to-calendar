'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { Logo } from '@/components/logo'
import { ThemeControl } from '@/components/theme-control'
import { Stepper } from '@/components/stepper'
import { Landing } from '@/components/landing'
import { UploadStep, canProceed } from '@/components/upload-step'
import { ReviewStep } from '@/components/review-step'
import { ExportStep } from '@/components/export-step'
import { SwRegister } from '@/components/sw-register'
import { SocialLinks, SupportLink } from '@/components/site-links'
import { initialState, load, reducer, save, type Step } from '@/lib/store'

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
    setStorageBlocked(!save(state))
  }, [state])

  // Moving between steps should start you at the top of the new screen, not halfway down it.
  useEffect(() => {
    if (!hydrated.current) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.step])

  const done = new Set<Step>()
  if (canProceed(state.courses)) done.add(1)
  if (state.step === 3) done.add(2)

  const onLanding = state.step === 0

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6">
      <SwRegister />

      <header className="mb-8 flex items-center justify-between gap-3">
        {/* The mark always goes home, whatever step you are on. */}
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 0 })} className="flex items-center gap-2.5" aria-label="Syllabify home">
          <Logo size={32} />
          <span className="font-display text-2xl">Syllabify</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          {!onLanding && <Stepper current={state.step} done={done} onGo={(s) => dispatch({ type: 'setStep', step: s })} />}
          <span className="hidden h-5 w-px bg-line sm:block" />
          <SocialLinks className="hidden sm:flex" />
          <ThemeControl />
        </div>
      </header>

      {storageBlocked && !onLanding && (
        <div role="alert" className="note note-warn rise mb-6">
          <strong>Your browser is blocking saving.</strong> Your classes will vanish if you close this tab, so download your file before you go.
        </div>
      )}

      {state.step === 0 && <Landing dispatch={dispatch} />}
      {state.step === 1 && <UploadStep state={state} dispatch={dispatch} />}
      {state.step === 2 && <ReviewStep state={state} dispatch={dispatch} />}
      {state.step === 3 && <ExportStep state={state} dispatch={dispatch} />}

      <footer className="mt-20 border-t border-line pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            Everything happens in this browser. Your syllabus, your photos and your grades are read here and never sent to a server, because there is no server
            to send them to. No account, no class limit, no paid tier.
          </p>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Made by Zach Weiss</span>
              <SocialLinks />
            </div>
            <SupportLink />
          </div>
        </div>
      </footer>
    </main>
  )
}
