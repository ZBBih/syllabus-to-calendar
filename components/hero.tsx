import { Infinite, Lock, Check } from './icons'

/**
 * Shown only before the first syllabus lands, then it gets out of the way.
 *
 * Every comparable product requires an account, uploads the file to a server, and starts
 * charging at the third or fourth class. That is the one thing this app can say that none of
 * them can, and it was previously buried in a footnote under the drop zone.
 */

const PROOF = [
  { icon: Lock, label: 'Nothing uploaded', detail: 'Your syllabus is read in this tab and never sent anywhere.' },
  { icon: Check, label: 'No account', detail: 'No email, no password, no sign-in wall before you see it work.' },
  { icon: Infinite, label: 'No class limit', detail: 'Every class, every term, free. There is no paid tier to hit.' },
]

export function Hero() {
  return (
    <div className="rise">
      <p className="eyebrow">Syllabus to calendar</p>
      <h1 className="h1 mt-3">
        Every deadline on your calendar
        <br className="hidden sm:block" /> before the first week is over.
      </h1>
      <p className="lede mt-4">
        Drop the syllabi your professors handed out. Check what was found. Send the lot to Google, Apple, or Outlook in one file.
      </p>

      <ul className="mt-7 grid gap-2 sm:grid-cols-3">
        {PROOF.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="card-sunk flex gap-2.5 p-3">
            <span className="mt-0.5 text-accent">
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
