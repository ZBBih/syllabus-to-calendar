'use client'

import type { Dispatch } from 'react'
import type { Action } from '@/lib/store'
import { SAMPLE_NAME, SAMPLE_TEXT } from '@/lib/sample'
import { ExtractDemo } from './extract-demo'
import { HeroArt } from './hero-art'
import { SupportLink } from './site-links'
import { ArrowRight, Check, Infinite, Lock, X } from './icons'

/**
 * The front door: one green block with the headline and the picture in it, the demonstration,
 * three proof points, the comparison, and the call to action again.
 *
 * The app used to open onto a drop zone, which asks for a file before it has said what it
 * does or why handing one over is safe. This page makes the case first, in the one way no
 * competitor can match, and then gets out of the way for good.
 *
 * The case is made twice over: once in words, and once by the demonstration directly under the
 * hero, which runs the real extractor in front of the visitor rather than telling them it works.
 * That demonstration is also why there is no "how it works" strip: it would say in clipart
 * what the panel above it proves.
 */

const PROOF = [
  {
    icon: Lock,
    label: 'Nothing is uploaded',
    detail: 'Your syllabus is read inside this tab. There is no server to send it to.',
    tint: 'bg-accent-soft',
    iconBg: 'bg-accent text-accent-ink',
  },
  {
    icon: Check,
    label: 'No account',
    detail: 'No email, no password, no sign-in wall between you and the thing working.',
    tint: 'bg-warn-soft',
    iconBg: 'bg-joy-2 text-[#5a3d00]',
  },
  {
    icon: Infinite,
    label: 'No class limit',
    detail: 'Every class, every term, free. There is no paid tier waiting at the fourth one.',
    tint: 'bg-joy-3-soft',
    iconBg: 'bg-joy-3 text-white',
  },
]

const COMPARISON: { label: string; them: string; us: string }[] = [
  { label: 'Account required', them: 'Yes, before you see anything', us: 'Never' },
  { label: 'Your syllabus', them: 'Uploaded to their server', us: 'Never leaves your device' },
  { label: 'Class limit', them: 'One or two, then it is paid', us: 'No limit' },
  { label: 'Price', them: '$5 to $10 a month', us: 'Free' },
  { label: 'Works on', them: 'Often Apple only', us: 'Any browser, any phone' },
]

export function Landing({ dispatch }: { dispatch: Dispatch<Action> }) {
  const start = () => dispatch({ type: 'setStep', step: 1 })
  const sample = () => {
    dispatch({
      type: 'addFromFiles',
      files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }],
    })
    dispatch({ type: 'setStep', step: 2 })
  }

  return (
    <div className="step-enter">
      <section className="block block-hero grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:gap-10 lg:px-12 lg:py-16">
        <div>
          <h1 className="h-display">
            Your whole semester, on your calendar, <em className="text-hero-amber">in one minute.</em>
          </h1>
          <p className="mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-hero-muted sm:text-lg">
            Drop the syllabi your professors handed out. Every deadline, exam and class time gets
            pulled out. Send the lot to Google, Apple or Outlook in a single file.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={start} className="btn btn-on-hero btn-hero">
              Add my syllabi <ArrowRight size={18} />
            </button>
            <button type="button" onClick={sample} className="btn btn-ghost-on-hero btn-hero">
              See it on a sample
            </button>
          </div>
          <p className="mt-4 text-sm text-hero-quiet">Free forever. No sign-up. Nothing to install.</p>
        </div>

        <HeroArt onHero className="order-first mx-auto w-full max-w-md lg:order-none lg:max-w-none" />
      </section>

      <div className="mt-20 sm:mt-24">
        <ExtractDemo onSample={sample} />
      </div>

      <ul className="stagger mt-16 grid gap-4 sm:grid-cols-3">
        {PROOF.map(({ icon: Icon, label, detail, tint, iconBg }) => (
          <li key={label} className={`tile ${tint}`}>
            <span className={`tile-icon ${iconBg}`}>
              <Icon size={20} />
            </span>
            <h2 className="h3 mt-4">{label}</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed">{detail}</p>
          </li>
        ))}
      </ul>

      <section className="mt-20">
        <h2 className="h2">What makes this different</h2>
        <p className="lede mt-2">
          There are a dozen apps that read a syllabus. Every one of them wants an account, a copy
          of your file, and eventually your money.
        </p>
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="strip text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="px-2 py-3 font-semibold min-[400px]:px-4 sm:px-5" />
                <th className="px-2 py-3 font-semibold min-[400px]:px-4 sm:px-5">The other apps</th>
                <th className="px-2 py-3 font-semibold text-accent min-[400px]:px-4 sm:px-5">
                  Syllabify
                </th>
              </tr>
            </thead>
            <tbody className="text-[0.9375rem]">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th
                    scope="row"
                    className="px-2 py-3 text-left font-medium min-[400px]:px-4 sm:px-5"
                  >
                    {row.label}
                  </th>
                  <td className="px-2 py-3 text-muted min-[400px]:px-4 sm:px-5">
                    <span className="flex items-center gap-2">
                      <X size={14} className="shrink-0 text-danger" />
                      {row.them}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-medium min-[400px]:px-4 sm:px-5">
                    <span className="flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-accent" />
                      {row.us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="block block-soft mt-20 px-6 py-12 text-center sm:py-14">
        <h2 className="h2">Ready when you are</h2>
        <p className="lede mx-auto mt-2">One file, about a minute, and you are done for the term.</p>
        <button type="button" onClick={start} className="btn btn-primary btn-hero mt-6">
          Add my syllabi <ArrowRight size={18} />
        </button>
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted">
            This is free and always will be. If it saved you an evening, you can say thanks.
          </p>
          <SupportLink />
        </div>
      </section>
    </div>
  )
}
