'use client'

import { useState } from 'react'
import { buildIcs } from '@/lib/ics'
import type { Course } from '@/lib/store'

const GUIDES = {
  Google: [
    'Open calendar.google.com on a computer (imports are not available in the phone app).',
    'Optional but recommended: in the left sidebar, next to "Other calendars", click + then "Create new calendar" and name it School.',
    'Click the gear icon in the top right, then Settings.',
    'In the left menu choose "Import & export".',
    'Click "Select file from your computer" and pick my-classes.ics.',
    'In the "Add to calendar" dropdown choose School (or your main calendar), then click Import.',
    'Events appear right away and sync to your phone automatically.',
  ],
  Apple: [
    'On a Mac: double-click my-classes.ics in your Downloads folder.',
    'Calendar opens and asks which calendar to add the events to. Pick one (or create a School calendar first via File > New Calendar), then click OK.',
    'On iPhone or iPad: AirDrop or email yourself the file, tap it, then tap "Add All" and choose a calendar.',
    'If you use iCloud, the events sync to all your Apple devices.',
  ],
  Outlook: [
    'Outlook on the web: click the calendar icon, then "Add calendar" in the left sidebar.',
    'Choose "Upload from file", browse to my-classes.ics, pick the calendar to add to, and click Import.',
    'Outlook desktop (Windows): File > Open & Export > Import/Export > "Import an iCalendar (.ics) or vCalendar file", then choose Import.',
    'Outlook for Mac: File > Import, choose the .ics file, and follow the prompts.',
  ],
} as const

type Tab = keyof typeof GUIDES

export function DownloadPanel({ courses }: { courses: Course[] }) {
  const [tab, setTab] = useState<Tab>('Google')
  const [done, setDone] = useState(false)
  const included = courses.reduce((n, c) => n + c.events.filter((e) => e.include !== false && e.date).length, 0)
  const unnamed = courses.some((c) => c.events.some((e) => e.include !== false) && c.name.trim() === '')
  const canDownload = included > 0 && !unnamed

  function download() {
    const ics = buildIcs(
      courses.map((c) => ({
        name: c.name.trim(),
        events: c.events.filter((e) => e.include !== false && e.date && e.title.trim()),
      })),
    )
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-classes.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDone(true)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={download}
          disabled={!canDownload}
          className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Download calendar file
        </button>
        <span className="text-sm text-zinc-600">
          {unnamed
            ? 'Give every class a name first.'
            : included === 0
              ? 'Find and include some dates first.'
              : `${included} event${included === 1 ? '' : 's'} → my-classes.ics`}
        </span>
      </div>
      {done && <p className="mt-2 text-sm text-green-700">Saved to your Downloads folder. Now add it to your calendar:</p>}

      <div className="mt-5">
        <div className="flex gap-1 border-b border-zinc-200">
          {(Object.keys(GUIDES) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t === 'Apple' ? 'Apple Calendar' : t === 'Google' ? 'Google Calendar' : 'Outlook'}
            </button>
          ))}
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-800">
          {GUIDES[tab].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
          Tip: import into a separate calendar named School so you can give it its own colour or hide it over break. Each
          event has a reminder the day before.
        </p>
      </div>
    </div>
  )
}
