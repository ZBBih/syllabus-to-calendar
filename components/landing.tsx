"use client";

import type { Dispatch } from "react";
import type { Action } from "@/lib/store";
import { SAMPLE_NAME, SAMPLE_TEXT } from "@/lib/sample";
import { HeroArt } from "./hero-art";
import { HowItWorks } from "./how-it-works";
import { SupportLink } from "./site-links";
import { ArrowRight, Check, Infinite, Lock, X } from "./icons";

/**
 * The front door: picture, call to action, explanation, call to action again.
 *
 * The app used to open onto a drop zone, which asks for a file before it has said what it
 * does or why handing one over is safe. This page makes the case first, in the one way no
 * competitor can match, and then gets out of the way for good.
 */

const PROOF = [
  {
    icon: Lock,
    label: "Nothing is uploaded",
    detail:
      "Your syllabus is read inside this tab. There is no server to send it to.",
  },
  {
    icon: Check,
    label: "No account",
    detail:
      "No email, no password, no sign-in wall between you and the thing working.",
  },
  {
    icon: Infinite,
    label: "No class limit",
    detail:
      "Every class, every term, free. There is no paid tier waiting at the fourth one.",
  },
];

const COMPARISON: { label: string; them: string; us: string }[] = [
  {
    label: "Account required",
    them: "Yes, before you see anything",
    us: "Never",
  },
  {
    label: "Your syllabus",
    them: "Uploaded to their server",
    us: "Never leaves your device",
  },
  { label: "Class limit", them: "One or two, then it is paid", us: "No limit" },
  { label: "Price", them: "$5 to $10 a month", us: "Free" },
  { label: "Works on", them: "Often Apple only", us: "Any browser, any phone" },
];

export function Landing({ dispatch }: { dispatch: Dispatch<Action> }) {
  const start = () => dispatch({ type: "setStep", step: 1 });
  const sample = () => {
    dispatch({
      type: "addFromFiles",
      files: [{ name: SAMPLE_NAME, text: SAMPLE_TEXT, viaPhoto: false }],
    });
    dispatch({ type: "setStep", step: 2 });
  };

  return (
    <div className="step-enter">
      <section className="grid items-center gap-8 pt-4 sm:pt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <h1 className="h-display">
            Your whole semester,
            <br />
            on your calendar,
            <br />
            <span className="text-accent">in one minute.</span>
          </h1>
          <p className="lede mt-6">
            Drop the syllabi your professors handed out. Every deadline, exam
            and class time gets pulled out. Send the lot to Google, Apple or
            Outlook in a single file.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={start}
              className="btn btn-primary btn-hero"
            >
              Add my syllabi <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={sample}
              className="btn btn-secondary"
            >
              See it on a sample
            </button>
          </div>
          <p className="mt-3.5 text-sm text-muted">
            Free forever. No sign-up. Nothing to install.
          </p>
        </div>

        <HeroArt className="order-first lg:order-none" />
      </section>

      <div className="mt-16">
        <HowItWorks onSample={sample} />
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={start}
          className="btn btn-primary btn-hero"
        >
          Add my syllabi <ArrowRight size={18} />
        </button>
      </div>

      <ul className="stagger mt-16 grid gap-3 sm:grid-cols-3">
        {PROOF.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="card lift p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon size={19} />
            </span>
            <h2 className="mt-3.5 font-semibold">{label}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {detail}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-20">
        <h2 className="font-display text-3xl">What makes this different</h2>
        <p className="lede mt-2">
          There are a dozen apps that read a syllabus. Every one of them wants
          an account, a copy of your file, and eventually your money.
        </p>
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold" />
                <th className="px-5 py-3 font-semibold">The other apps</th>
                <th className="px-5 py-3 font-semibold text-accent">
                  Syllabify
                </th>
              </tr>
            </thead>
            <tbody className="text-[0.9375rem]">
              {COMPARISON.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-line last:border-0"
                >
                  <th scope="row" className="px-5 py-3 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-5 py-3 text-muted">
                    <span className="flex items-center gap-2">
                      <X size={14} className="shrink-0 text-danger" />
                      {row.them}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">
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

      <section className="mt-20 text-center">
        <h2 className="font-display text-3xl">Ready when you are</h2>
        <p className="lede mx-auto mt-2">
          One file, about a minute, and you are done for the term.
        </p>
        <button
          type="button"
          onClick={start}
          className="btn btn-primary btn-hero mt-6"
        >
          Add my syllabi <ArrowRight size={18} />
        </button>
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted">
            This is free and always will be. If it saved you an evening, you can
            say thanks.
          </p>
          <SupportLink />
        </div>
      </section>
    </div>
  );
}
