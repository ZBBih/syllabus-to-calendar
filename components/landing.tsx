'use client'

import type { Dispatch } from 'react'
import type { Action } from '@/lib/store'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'
import { Logo } from './logo'
import { ArrowRight, Camera, Check, Doc, Infinite, Lock, Swap, X } from './icons'

/**
 * The front door.
 *
 * The app used to open straight onto a drop zone, which asks for a file before it has said
 * what it does or why it is safe to hand one over. This page makes the case first, in the one
 * way no competitor can match, and then gets out of the way for good: once a class exists the
 * flow never returns here.
 */

const PROOF = [
  { icon: Lock, label: 'Nothing is uploaded', detail: 'Your syllabus is read inside this tab. There is no server to send it to.' },
  { icon: Check, label: 'No account', detail: 'No email, no password, no sign-in wall standing between you and the thing working.' },
  { icon: Infinite, label: 'No class limit', detail: 'Every class, every term, free. There is no paid tier waiting at the fourth one.' },
]

const STEPS = [
  { n: '01', icon: Doc, title: 'Drop them all', body: 'PDF, Word, a screenshot, or a photo of the printed page. Each file becomes a class.' },
  { n: '02', icon: Check, title: 'Check the dates', body: 'Anything the parser is unsure about is flagged. Nothing reaches your calendar until you say so.' },
  { n: '03', icon: ArrowRight, title: 'Send it over', body: 'One file into Google, Apple, or Outlook, with a reminder on every deadline.' },
]

const COMPARISON: { label: string; them: string; us: string }[] = [
  { label: 'Account required', them: 'Yes, before you see anything', us: 'Never' },
  { label: 'Your syllabus', them: 'Uploaded to their server', us: 'Never leaves your device' },
  { label: 'Class limit', them: 'One or two, then it is paid', us: 'No limit' },
  { label: 'Price', them: '$5 to $10 a month', us: 'Free' },
  { label: 'Works on', them: 'Often Apple only', us: 'Any browser, any phone' },
]

export function Landing({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div className="step-enter">
      <section className="pt-6 sm:pt-14">
        <div className="float mb-6 inline-block">
          <Logo size={54} animate />
        </div>
        <p className="eyebrow">Syllabus to calendar</p>
        <h1 className="h1 mt-3 max-w-[15ch]">
          Every deadline on your calendar before the first week is over.
        </h1>
        <p className="lede mt-5 text-[1.0625rem]">
          Drop the syllabi your professors handed out. Check what was found. Send the whole term to your calendar in one file. It takes about a minute and asks
          nothing of you.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-primary btn-hero">
            Add my syllabi <ArrowRight size={17} />
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'addFromFiles', files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }] })
              dispatch({ type: 'setStep', step: 2 })
            }}
            className="btn btn-secondary"
          >
            See it work on a sample
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">No sign-up. Nothing to install. Works on the phone in your hand.</p>
      </section>

      <ul className="stagger mt-14 grid gap-3 sm:grid-cols-3">
        {PROOF.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="card lift p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon size={17} />
            </span>
            <h2 className="mt-3 text-sm font-semibold">{label}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
          </li>
        ))}
      </ul>

      <section className="mt-16">
        <h2 className="font-display text-2xl">How it goes</h2>
        <ol className="stagger mt-5 grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <li key={n} className="card lift p-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl text-accent tabular-nums">{n}</span>
                <span className="text-muted">
                  <Icon size={15} />
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl">What makes this different</h2>
        <p className="lede mt-2 text-sm">
          There are a dozen apps that read a syllabus. Every one of them wants an account, a copy of your file, and eventually your money.
        </p>
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-semibold" />
                <th className="px-4 py-2.5 font-semibold">The other apps</th>
                <th className="px-4 py-2.5 font-semibold text-accent">Syllabify</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5 text-muted">
                    <span className="flex items-center gap-1.5">
                      <X size={13} className="shrink-0 text-danger" />
                      {row.them}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Check size={13} className="shrink-0 text-accent" />
                      {row.us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stagger mt-16 grid gap-3 sm:grid-cols-2">
        <div className="card-sunk p-4 sm:p-5">
          <span className="text-accent">
            <Swap size={17} />
          </span>
          <h2 className="mt-2 text-sm font-semibold">When a deadline moves</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A syllabus is right the day it is written and starts drifting the week after. Drop the revised file in again: you get a list of exactly what changed,
            and the next export corrects your calendar in place rather than leaving two of everything.
          </p>
        </div>
        <div className="card-sunk p-4 sm:p-5">
          <span className="text-accent">
            <Camera size={17} />
          </span>
          <h2 className="mt-2 text-sm font-semibold">Even a photo of the page</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Point your camera at the printed handout. The text is read on your device, so the picture never leaves the browser and nobody else ever sees your
            schedule.
          </p>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="font-display text-2xl">Ready when you are</h2>
        <p className="lede mx-auto mt-2 text-sm">It takes one file and about a minute.</p>
        <button type="button" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="btn btn-primary btn-hero mt-5">
          Add my syllabi <ArrowRight size={17} />
        </button>
      </section>
    </div>
  )
}
