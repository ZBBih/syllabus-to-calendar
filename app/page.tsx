'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { Logo } from '@/components/logo'
import { ThemeControl } from '@/components/theme-control'
import { Stepper } from '@/components/stepper'
import { UploadStep, canProceed } from '@/components/upload-step'
import { ReviewStep } from '@/components/review-step'
import { ExportStep } from '@/components/export-step'
import { SwRegister } from '@/components/sw-register'
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

  const done = new Set<Step>()
  if (canProceed(state.courses)) done.add(1)
  if (state.step === 3) done.add(2)

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 sm:px-6">
      <SwRegister />
      <header className="mb-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="flex items-center gap-2.5" aria-label="Syllabify home">
          <Logo size={34} />
          <span className="font-display text-xl font-black tracking-tight">Syllabify</span>
        </button>
        <ThemeControl />
      </header>

      <div className="mb-8 flex justify-center">
        <Stepper current={state.step} done={done} onGo={(s) => dispatch({ type: 'setStep', step: s })} />
      </div>

      {storageBlocked && (
        <div role="alert" className="pop mb-6 rounded-2xl border border-accent bg-accent-soft p-4 text-sm">
          <strong>Your browser is blocking saving.</strong> Your classes will vanish if you close this tab, so download your file before you go.
        </div>
      )}

      {state.step === 1 && <UploadStep state={state} dispatch={dispatch} />}
      {state.step === 2 && <ReviewStep state={state} dispatch={dispatch} />}
      {state.step === 3 && <ExportStep state={state} dispatch={dispatch} />}

      <footer className="mt-16 border-t border-line pt-4 text-center text-xs text-muted">Everything stays in this browser. Nothing is uploaded anywhere.</footer>
    </main>
  )
}
