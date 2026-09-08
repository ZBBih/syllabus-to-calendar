# Syllabify improvement review

Date: 2026-09-08
Reviewed by: improve-project skill
Prior review: docs/reviews/2026-09-07-improve-project.md

## State of the project

Syllabify turns syllabi into calendar files entirely in the browser: no account, no server,
no API key, nothing uploaded. Next.js 16 App Router on React 19 and Tailwind v4, built fully
static and deployed to Vercel with no API routes and no server actions; pdf.js, mammoth and a
self-hosted tesseract read files on the device, chrono-node finds the dates, and the whole of
a student's work lives in one localStorage key. The work sits on `syllabus-reading`, thirteen
commits ahead of an untouched `main`, and nothing has been promoted to production. Since the
last review the selected build list largely landed: a term change now re-extracts, the class
name and term are read from the syllabus body, date ranges carry through as multi-day events,
and share-the-link shipped on the finished screen. Today's commit closed the calendar-file
injection surface in three layers and put caps on how much text and how many pages one upload
can push through the scanner. The lint, typecheck and dependency-audit checks are all clean
and the suite is green.

## Who it is for and what they need

College students, on phone and laptop equally, loading three to six syllabi in one sitting at
the start of a semester so every deadline lands in their calendar without retyping any of it.
The link spreads by word of mouth and almost nobody outside the owner has opened it yet. Asked
what worries him most about the first friends opening the link, the owner named one thing:
**their data leaking or being seen** — someone else, or the owner, ending up able to read a
student's syllabus, grades or deadlines. Deploy target is Vercel, static.

Not flagged by design: no accounts and localStorage only, with nothing uploaded and no server;
rule-based extraction with no AI and no API key; the six-megabyte tesseract bundle self-hosted
from this origin rather than a CDN. `'unsafe-inline'` in the CSP was a recorded decision in an
earlier round but was deliberately left unprotected this time, so it was examined.

## Working well and worth keeping

- **Nothing a student loads ever leaves the device, and the service worker never caches
  anything carrying their content** (`public/sw.js:16`) This is the single claim the whole
  privacy promise rests on, and it holds under line-by-line reading: the fetch handler
  early-returns on any non-GET and any cross-origin request, the one `cache.put` admits only
  the static shell, fingerprinted bundles and the recogniser, and the navigate branch is safe
  because the app is one route and no syllabus content ever enters a URL. Verified: verifier
  confirmed, and found no network call of any kind in `app/`, `components/` or `lib/` — no
  analytics package, fonts self-hosted through `next/font`, OCR pinned to `/tesseract`,
  outbound links carrying `rel="noreferrer noopener"`, and `connect-src 'self'` as a backstop.
- **Saved state is rebuilt field by field on load, and both load and save fail closed**
  (`lib/store.ts:339`) A student's whole semester exists only in localStorage, so a corrupted
  or hand-edited value has to degrade rather than take the only copy down; a refused write
  surfaces as a visible warning instead of silent data loss. Verified: verifier confirmed, with
  the correction that there are six sanitizer helpers rather than five, and the note that the
  whitelist covers field names and types but not lengths.
- **The read report and the extracted events come from one pass over the text**
  (`lib/extract.ts:87`) The report is the feature that answers "what did it miss", and building
  it from the same scan that finds the dates means it cannot disagree with what was actually
  captured. Verified: verifier confirmed, with the caveat that `extractEvents` dedupes
  afterwards, so a repeated date and title can appear captured in the report without earning
  its own row.
- **Changing a class's term re-runs extraction and reports what changed**
  (`lib/store.ts:123`) A student loading next semester's syllabus early would otherwise watch
  the count sit at zero with no way back; this was the top fix in the previous review and it
  has landed properly, down to the change summary adding the year for exactly this case.
  Verified: verifier confirmed.
- **The class name and the term are read out of the syllabus body, not just the file name**
  (`lib/store.ts:154`) Wired into every intake path — drop, paste and camera — so a file called
  `IMG_4821` or `Syllabus (1).pdf` still arrives named, which removes a phone-keyboard typing
  step per class in the one sitting where a student does it six times.
- **Sharing the link sits at the moment the export just worked, with feedback in every
  fallback** (`components/export-step.tsx:142`) Web Share where available, clipboard with a
  confirmation, raw URL as the last resort — no dead end in any branch, placed at the one
  moment a student feels the payoff. Word of mouth is the only distribution this product has.
- **The file picker names extensions instead of using a wildcard** (`lib/convert.ts:27`)
  A documented tradeoff: `image/*` makes the OS picker resolve the type of every file before
  the window paints, which stalls on the cluttered Downloads folder a student actually opens.
- **The landing illustration is inline SVG driven by CSS rather than shipped bytes**
  (`components/hero-art.tsx:22`) Zero network weight and theme-aware on the first screen every
  new student sees, which matters most on the phone half of the audience.

## Not working and why

- **"Start over" leaves every exported assignment title and date sitting in the browser**
  (`lib/store.ts:229`) The `clear` action deliberately preserves `lastExport` so a later export
  still corrects the calendar an earlier one wrote to instead of duplicating onto it — sound
  reasoning for the calendar, and a direct hit on the owner's stated worry. A student who
  starts over on a library or roommate's machine leaves a plaintext list of course names,
  assignment titles and dates behind, readable by anyone who opens devtools. Raised by two
  lenses. Verified: verifier confirmed, and settled the trade — **both can be had.** Retraction
  matches purely on UID, and the cancellation entry uses only the uid, the date and the
  cancelled status; the summary on it is cosmetic. Clearing the summary while keeping the uid
  and date preserves the calendar behaviour exactly, leaving only opaque hashes and bare dates
  behind, at the cost of a blank title on the struck-through calendar row.
- **Every keystroke serializes the entire application state to disk** (`app/page.tsx:39`)
  The save effect is keyed on the whole state object with no debounce, so typing a class name
  or a grade percentage re-stringifies everything — including the full text of every syllabus
  loaded, which for six classes is hundreds of kilobytes per character. This is the shape of
  bug that makes typing feel laggy on exactly the lower-end phones this audience carries.
  Verified: verifier confirmed.
- **A row added or corrected by hand can never be given an end date**
  (`components/review-table.tsx:51`) Multi-day ranges landed for automatic extraction, but the
  table renders a pill only to *remove* an existing end date and the preset an added row is
  built from has no end-date field at all, so a student recovering "Oct 20-21 Fall break" from
  the read report gets a single day and no way to widen it. A half-landed version of a shipped
  feature. Verified: verifier confirmed.
- **The store file carries the reducer, the persistence layer and six hand-written sanitizers
  together** (`lib/store.ts`) Every new field on a course or event has to be threaded through
  the reducer and its sanitizer by hand in the same file, and missing one is how a field
  silently stops surviving a reload — the exact failure a student would experience as losing
  their semester. Carried over unaddressed from the previous review. Verified: verifier
  confirmed, correcting the count to six helpers and noting there is no separate state machine.
- **The export screen's per-class menu cannot be dismissed** (`components/export-step.tsx:292`)
  No outside-click, no blur, no Escape handler, though the paste sheet and the read report both
  close on Escape. It sits on the last screen before a student leaves, where an apparently
  stuck menu is the final impression. Verified: verifier confirmed.
- **A bulk re-extraction exists in the reducer that nothing can reach**
  (`lib/store.ts:140`) The `extractAll` action is dispatched from no component; only tests
  exercise it. Carried over unaddressed from the previous review. Verified: verifier confirmed
  by grep across the whole tree.
- **The toolchain is further behind than it looks** (`package.json`) TypeScript is two majors
  behind and the Node types six, with eslint and vitest one each. Today, with lint and
  typecheck both clean, is the cheapest this jump will ever be, and it gets more disruptive
  once real users are on it. Verified: verifier confirmed against the registry and noted the
  original claim understated the gap.
- **Long PDFs are walked a page at a time** (`lib/convert.ts:90`) Each page awaits its own
  round trip through the worker, up to the four-hundred-page cap, so the wait grows worst
  exactly when the file is largest. Verified: verifier confirmed.

## Worth adding and why

- **Cheap win: an "erase everything on this device" control**
  (`lib/store.ts:226`) `localStorage.removeItem` is called nowhere in the codebase, and the
  only reset is the "Start over" button that by design keeps the export history. A student who
  begins on a shared machine and abandons halfway, or who finishes and wants to leave nothing
  behind, has no way to do it inside the app and must know to clear site data in browser
  settings. This is the owner's stated worry made operable, and it is a few lines. Raised by
  two lenses. Verified: verifier confirmed the gap.
- **Workflow change: one cross-class queue for the rows that need checking**
  (`components/review-step.tsx:35`) The "Needs check" filter is scoped to the active class, so
  a student with six syllabi selects each tab in turn to find the amber rows. Checking amber
  rows is the one action repeated once per class in a single sitting, and a single list — every
  uncertain row from every class, labelled and fixed in place — collapses six tab-hunts into one
  pass. Verified: verifier confirmed, noting the per-class counts do at least signpost the hunt.
- **Bigger bet: none proposed this round.** The semester workload map the new-features lens put
  forward was downgraded in verification: the gap is real, but the need it serves does not
  appear anywhere in the brief, which is about getting deadlines into a calendar without
  retyping. Proposing it would be inventing a goal for the owner rather than serving one.
- **Say the app works offline, and invite the student to prove it** (`public/sw.js:1`) The
  service worker already caches the shell, the bundles and the whole recogniser, so the app
  runs with the network off — and nothing in the interface mentions it; the word "offline"
  appears nowhere outside tests. The landing page asserts that nothing is uploaded and a
  student has to take it on faith. "Turn on airplane mode and use it anyway" is a demonstration
  no competitor can copy and the strongest possible answer to the owner's worry. Verified:
  verifier confirmed the capability exists and is never surfaced.
- **Promote the by-date view to sit beside the per-class table**
  (`components/review-step.tsx:138`) It is gated on having more than one class and collapsed by
  default, so the clash information the export screen warns about ("some days have two or more
  things due") is a step back and a disclosure away from the warning pointing at it. Verified:
  verifier confirmed.

## Code health

- The store file combines reducer, persistence and six sanitizers in one place
  (`lib/store.ts`); carried over from the previous review.
- The `extractAll` action is unreachable from the interface (`lib/store.ts:140`).
- TypeScript is two majors behind, Node types six, eslint and vitest one each (`package.json`).
- Saved state is rebuilt field by field and fails closed on both load and save
  (`lib/store.ts:339`) — worth preserving through any split of the file.
- The read report and the event list come from a single scan (`lib/extract.ts:87`).

## Security

- "Start over" preserves the exported titles and dates in the browser (`lib/store.ts:229`);
  verification established that privacy and the retraction behaviour are compatible.
- No control exists anywhere to erase saved work from a device (`lib/store.ts:226`).
- Nothing carrying a student's content is cached or sent off-origin (`public/sw.js:16`).
- **Replacing `'unsafe-inline'` in `script-src` with a hash is not available here.**
  Downgraded: the theme script is indeed a fixed string, but the prerendered HTML also carries
  Next's own RSC flight-payload scripts, whose contents change with every build and every route
  and cannot be known when the config is written. A hash-only policy would break the build. The
  remaining routes are a nonce, which needs middleware and makes the page dynamic, or leaving
  the directive as it is. A smaller separate win does exist: `style-src 'unsafe-inline'` is its
  own directive and was not examined this round.
- Two caveats on the no-data-leaves claim, neither contradicting it: the share sheet at
  `components/export-step.tsx:125` hands the calendar file to an OS target the student picks,
  and the host logs ordinary request metadata as any static host does. No syllabus content
  appears in either.

## Performance

- Full state is serialized to localStorage on every keystroke (`app/page.tsx:39`).
- PDF pages are read strictly in series (`lib/convert.ts:90`).
- The recogniser is spawned and torn down once per image (`lib/ocr.ts:61`). Downgraded: the
  code fact is exact, but the repeat cost is worker spawn, wasm instantiation and model parse
  rather than a six-megabyte download, because the service worker already caches the bundle.
- Dropped files are converted one after another (`components/file-drop.tsx:29`). Downgraded:
  sequential is defensible for photographs, since each recognition holds a worker, a wasm core
  and a large canvas and up to twenty files are accepted, so parallel OCR is a plausible
  out-of-memory failure on a phone. A bounded pool for the PDF, Word and text paths is the
  defensible version.
- The hero illustration ships as inline SVG with no image bytes (`components/hero-art.tsx:22`).
- The picker names extensions rather than wildcarding (`lib/convert.ts:27`).

## Existing features

- A hand-added row cannot be given an end date (`components/review-table.tsx:51`).
- The per-class export menu has no dismiss affordance (`components/export-step.tsx:292`).
- Term changes re-extract and report a diff (`lib/store.ts:123`).
- The class name and term are read from the syllabus text on every intake path
  (`lib/store.ts:154`).
- Share-the-link shipped with feedback in every fallback (`components/export-step.tsx:142`).
- The re-read diff is wired end to end (`components/change-summary.tsx:88`). Downgraded: the
  actions are not per-row — keep and drop apply to all missing rows at once, only the missing
  category has actions at all, and per-row removal lives in the review table instead.

## New features

- An erase-everything control (`lib/store.ts:226`).
- A cross-class queue for rows needing a check (`components/review-step.tsx:35`).
- Surfacing the offline capability as a demonstration (`public/sw.js:1`).
- Promoting the by-date view beside the per-class table (`components/review-step.tsx:138`).
- A semester workload map (`components/date-preview.tsx:12`). Downgraded: the aggregation gap
  is real, but the need is not in the brief.

## Changed since last review

The previous review's selected build list has largely shipped: the term change now re-extracts
(its top fix), the class name and term are read from the syllabus text, every date on a line is
read, and date ranges carry through as multi-day events — though that last one only for
automatic extraction, not for rows a student adds by hand. Share-the-link shipped. The "what we
read" view, deferred last time, has shipped too. Three items remain untouched: the store file
still carries persistence and sanitizers together, `extractAll` is still unreachable, and the
grade panel's test gap was not re-examined this round. New since then: the calendar-file
injection surface was closed today in three layers with caps on upload size and page count, and
this round surfaces the localStorage exposure that the earlier reviews did not reach.

## Open questions

- The Apple Calendar import guidance in `components/export-step.tsx` is still known to be wrong
  and still blocks a merge to `main`. It cannot be fixed by guessing; it needs the owner to
  report what the Files app actually shows on the phone. This copy has already been corrected
  once for being untrue.
- The photo path's extraction accuracy is still unmeasured, carried over from the previous
  review and not investigated here.
- `style-src 'unsafe-inline'` was not examined; it is a separate directive from the script one
  that was ruled out, and may be tightenable on its own.
- The grade panel still has no test, per the previous review; this round did not reopen it.
- Whether a blank summary on a cancelled calendar row is acceptable to the owner is a product
  judgement the fix to "Start over" depends on.
- Areas no lens opened: `lib/uid.ts`, `lib/meeting.ts`, `lib/merge.ts` internals,
  `scripts/vendor-ocr.mjs`, `app/opengraph-image.tsx`, and the test files.

## Evidence run

- `npm run lint --if-present` — ran, exit 0, clean. `evidence/lint.txt`
- `npx --no-install tsc --noEmit` — ran, exit 0, clean. `evidence/typecheck.txt`
- `npm audit` — ran, zero vulnerabilities. `evidence/audit.txt`
- source size census — ran. `evidence/size.txt`
- `npm test` — skipped, slow tier; the suite was run separately this session, 243 passing.
- `npm run build` — skipped, slow tier; run separately this session, clean.
- `npm view` on four packages — run by the verifier to settle the dependency claim.

## Run stats

Elapsed: about seventeen minutes from orientation to this file. Five subagents: four lens
agents (security, existing-features and code-and-performance on sonnet; new-features on the
default model) and one verifier on the default model. No lens agent reported hitting a file-open
or time cap, and each listed what it left unexamined; those gaps are folded into Open questions.
