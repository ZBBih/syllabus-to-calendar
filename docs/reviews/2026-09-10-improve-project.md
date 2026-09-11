# Syllabify improvement review

Date: 2026-09-10
Reviewed by: improve-project skill
Prior review: docs/reviews/2026-09-08-improve-project.md

## State of the project

Syllabify turns syllabi into calendar files entirely in the browser: no account, no server, no
API key, nothing uploaded. Next.js 16 App Router on React 19.3 and Tailwind v4, built static and
deployed to Vercel with no API routes and no server actions; pdf.js, mammoth and a self-hosted
tesseract read files on the device, chrono-node finds the dates, and a student's whole semester
lives in one localStorage key. Everything the last review left open on a branch has since been
merged: `main` is clean, the working tree is clean, and the tree has moved by twenty-two commits
since that review. Lint, typecheck and the dependency audit are all clean. The last round's
selected build list has landed in full — the localStorage leak on "Start over" is closed, the
unreachable bulk-extraction action is gone, the export menu dismisses, a hand-added row can be
given an end date, the Apple Calendar guidance has been rewritten around what the iPhone
actually does, and the toolchain jump was taken. Nothing in the tree is half-shipped or in
flight. What remains open is not correctness but presentation.

## Who it is for and what they need

College students, on phone and laptop equally, loading three to six syllabi in one sitting at
the start of a semester so every deadline lands in their calendar without retyping any of it.
Students come first: the owner's position is that the portfolio value comes from the thing
genuinely working, not from decoration. Distribution is word of mouth and almost nobody outside
the owner has opened it. Asked where it falls short, the owner named presentation, not
function: **"It works but doesn't look impressive. The engineering is solid but a reviewer
skimming for thirty seconds won't see it. Needs presentation: README, demo, visible depth."**
Deploy target is Vercel, static, free tier.

Not flagged by design: no accounts and localStorage only, with nothing uploaded and no server;
rule-based extraction with no AI and no API key; the free-tier static deploy with no API routes,
no server actions and no custom domain. The self-hosted tesseract bundle was left open to
examination this round and no lens raised it.

## Working well and worth keeping

- **"Start over" now blanks the assignment title and class tag on every recorded export entry
  instead of deleting the entry** (`lib/store.ts:270`) The calendar still gets corrected on a
  later export, and what stays on a library machine is an opaque hash and a bare date rather
  than a readable list of coursework. This was the top fix of the previous review and it landed
  exactly as the trade was described. Verified: verifier confirmed.
- **The Apple Calendar guidance was rewritten with a separate iPhone path, and the save on that
  path skips the debounce** (`components/export-step.tsx:179`) Guidance that contradicted the
  phone blocked a merge for two rounds; the phone half of the audience now gets steps that match
  what it does, and state is written before the navigation away rather than lost to a pending
  timer. Verified: verifier confirmed.
- **Calendar-file generation escapes every text field and validates identifiers and dates before
  they reach a VEVENT line** (`lib/ics.ts:98`) A crafted title or file name cannot inject extra
  events or alarms into a student's real calendar, which is the one place this app writes into
  something a student cares about outside the browser. Verified: verifier confirmed.
- **Saved state is validated field by field on the way in from disk** (`lib/persist.ts:22`) A
  corrupted or hand-edited stored value degrades rather than crashing the app or carrying
  malformed data into the calendar file. Verified: verifier confirmed.
- **The saved-state reader still understands the shape that predates the user-dated flag**
  (`lib/persist.ts:46`) Returning students' semesters survive app updates instead of silently
  emptying, and a refactor to a generic schema validator would quietly drop this. Verified:
  verifier confirmed.
- **Writes to disk are coalesced behind a short trailing debounce, bypassed only where a pending
  write would be lost** (`lib/persist.ts:174`) The previous review's typing-lag finding is fully
  addressed, and the one place the debounce is unsafe is handled deliberately rather than by
  turning the debounce off. Verified: verifier confirmed.
- **The three heavy readers load only inside the path that needs them** (`lib/convert.ts:85`)
  A student who uploads a plain PDF never downloads the recogniser, which matters most on the
  phone half of the audience. Verified: verifier confirmed.
- **Uploads are capped by bytes, by page count and by extracted characters before any text
  reaches the scanner** (`lib/convert.ts:27`) With no server to absorb it, a malformed file
  would otherwise freeze the tab on exactly the phones this audience carries. Verified: verifier
  confirmed.
- **"See it on a sample" lands on the review screen with the grade calculator and the weekly
  meeting already on screen** (`components/landing.tsx:91`) A stranger sees two of the harder
  pieces of the product working without having a syllabus in hand. Verified: verifier confirmed.
- **The per-class menu on the export screen closes on Escape and on an outside click**
  (`components/export-step.tsx:139`) The previous round's top existing-features fix, on the last
  screen before a student leaves. Verified: verifier confirmed.
- **A row added or corrected by hand can be given an end date** (`components/review-table.tsx:73`)
  The half-landed multi-day feature from the previous review is now whole. Verified: verifier
  confirmed.
- **The offline capability is stated to the user, gated on the service worker actually being in
  control** (`app/page.tsx:161`) The privacy claim stops being something only a reader of the
  source can confirm. Verified: verifier confirmed.
- **An erase-everything control exists with a confirm step** (`app/page.tsx:167`) A student on a
  shared machine can leave nothing behind without knowing how to clear site data. Verified:
  verifier confirmed.
- **The unreachable bulk re-extraction action was deleted rather than left in place**
  (`lib/store.ts`) Carried unaddressed through two prior reviews and now actually gone, which
  keeps the reducer trustworthy. Verified: verifier confirmed.
- **The toolchain is current** (`package.json`) TypeScript, the Node types, eslint and vitest
  are all on their current majors with lint and typecheck clean. Verified: verifier confirmed.

## Not working and why

- **The CSP allows inline script in production, not only in development** (`next.config.ts:14`)
  The development-only branch beside it handles `unsafe-eval`, so the unconditional
  `'unsafe-inline'` reads as deliberate but is not marked as such, and it is the one layer that
  would still stand if a future change rendered something unescaped. Nothing in the tree is
  exploitable through it today. Verified: verifier confirmed.
- **PDF pages are read one at a time in sequence** (`lib/convert.ts:90`) Each page awaits the
  previous one, so a long syllabus near the page cap makes a student watch hundreds of
  round-trips finish in order rather than concurrently, in the upload step of a sitting where
  they do this several times over. Verified: verifier confirmed.

## Worth adding and why

- **Cheap win: make the sample a multi-class semester rather than one class** (`lib/sample.ts:1`)
  The sample loads exactly one class, so the per-class tabs, the all-classes-by-date view, the
  shared-day clash warning and the cross-class needs-check queue are all unreachable from the
  single button a first-time visitor presses. A student pressing it sees a demo smaller than
  their own problem. Verified: verifier confirmed.
- **Workflow change: set the term once for the whole sitting** (`components/class-row.tsx:93`)
  The term is two selects on every class row with no way to say it once, so a student whose
  syllabi do not name the term repeats the same choice for every class. A wrong term silently
  drops dates outside its window, which is the most likely reason a student sees nothing and
  gives up. Verified: verifier confirmed.
- **Bigger bet: show the extraction engine running on the landing page**
  (`components/landing.tsx:66`) The page argues entirely in claims, a comparison table and a
  drawn illustration; the only way to see the product work is to press a button that leaves the
  page. A panel that runs the real extractor over sample syllabus text, raw lines on one side
  and dated rows landing on the other, turns the page from assertion into demonstration for the
  student deciding whether to bother and for the reviewer skimming. Verified: verifier confirmed.
- **Put a recording in the README** (`README.md`) The README describes the whole product in
  prose with no screenshot and no recording, and word of mouth is the only distribution this
  has. A short capture of syllabi going in and one calendar file coming out is what both a
  student's friend and an evaluator actually look at first. Verified: verifier confirmed.
- **Cover the landing page's sample and start handlers with a test** (`components/landing.tsx:34`)
  The first interaction anyone has with the product has no test behind its dispatch wiring.
  Verified: verifier confirmed.

## Code health

- The landing page uses a different quote and semicolon style from the rest of the tree, which
  lint does not catch (`components/landing.tsx:1`). Downgraded: only the landing page and the
  link-preview image route are affected; the illustration files match the house style, contrary
  to the original claim.
- The confetti component has no test behind its canvas physics, audio synthesis and portal
  lifecycle (`components/confetti.tsx`). Downgraded: it is genuinely untested, but so are about
  half the components, so the claim that it stands out is wrong.
- The landing page's sample and start handlers have no test (`components/landing.tsx:34`).

## Security

- The CSP allows inline script in production rather than only in development
  (`next.config.ts:14`).
- Saved state is validated field by field on load (`lib/persist.ts:22`).
- Calendar-file generation escapes text and validates identifiers and dates (`lib/ics.ts:98`).
- "Start over" blanks readable coursework from the recorded export entries (`lib/store.ts:270`).
- Uploads are capped by bytes, pages and characters before scanning (`lib/convert.ts:27`).

## Performance

- PDF pages are read sequentially rather than concurrently (`lib/convert.ts:90`).
- Heavy readers load only inside the path that needs them (`lib/convert.ts:85`).
- Disk writes are debounced, with a deliberate bypass where a pending write would be lost
  (`lib/persist.ts:174`).

## Existing features

- The sample cannot show the re-read diff or the on-device recogniser, because it is a single
  text load with no photo and no second read (`lib/sample.ts:1`). Downgraded: the gap is real,
  but the brief does not name those two features specifically as things that must be visible in
  the first thirty seconds.
- The all-classes-by-date view was reported as collapsed by default. Rejected: it already opens
  by itself whenever a clash exists.
- The sample lands on the review screen with the grade calculator and weekly meeting visible
  (`components/landing.tsx:91`).
- The export screen's per-class menu dismisses on Escape and outside click
  (`components/export-step.tsx:139`).
- A hand-added row can be given an end date (`components/review-table.tsx:73`).
- The bulk re-extraction action has been removed (`lib/store.ts`).
- The offline capability is surfaced to the user (`app/page.tsx:161`).
- An erase-everything control exists with a confirm step (`app/page.tsx:167`).
- The Apple Calendar guidance matches what the iPhone does (`components/export-step.tsx:179`).
- The toolchain is current (`package.json`).

## New features

- A multi-class sample (`lib/sample.ts:1`).
- Setting the term once for the sitting (`components/class-row.tsx:93`).
- A live extraction panel on the landing page (`components/landing.tsx:66`).
- A recording in the README (`README.md`).

## Changed since last review

Everything the previous review selected has shipped, and the branch it sat on has been merged.
The localStorage exposure on "Start over" is closed by blanking the summary and class tag while
keeping the identifier and date, which is precisely the trade the verifier proposed last round.
The export menu dismisses, the hand-added row takes an end date, the bulk re-extraction action
was deleted, the toolchain jump was taken, and the Apple Calendar guidance that blocked a merge
for two rounds was rewritten with a separate iPhone path once the owner reported what the phone
actually shows. The keystroke-serialization finding is closed by a debounced saver with a
deliberate bypass. The store file was split from persistence. The two carried-over structural
complaints from earlier rounds are both resolved. What this round surfaces is different in kind:
with the correctness backlog empty, every remaining item is about making the work visible — the
sample being smaller than the student's problem, the landing page arguing instead of
demonstrating, and a README with no picture in it.

## Open questions

- The photo path's extraction accuracy is still unmeasured, carried over from three prior rounds
  and not investigated here.
- The grade panel now has a test file; whether it covers the running-grade arithmetic rather
  than only rendering was not opened this round.
- Whether the landing page's style divergence is worth touching at all, given the bigger bet
  proposes rewriting that file anyway.
- Areas no lens opened: `lib/uid.ts`, `lib/meeting.ts`, `lib/merge.ts` internals,
  `lib/course-name.ts`, `lib/term.ts`, `scripts/vendor-ocr.mjs`, `app/opengraph-image.tsx`,
  `app/not-found.tsx`, `components/theme-control.tsx`, `components/paste-sheet.tsx`, the OCR
  intake path in `components/upload-step.tsx` and `components/file-drop.tsx`, and the test files.

## Evidence run

- `npm run lint --if-present` — ran, exit zero, clean. `evidence/lint.txt`
- `npx --no-install tsc --noEmit` — ran, exit zero, clean. `evidence/typecheck.txt`
- `npm audit` — ran, no vulnerabilities. `evidence/audit.txt`
- source size census — ran. `evidence/size.txt`
- `npm test` — skipped, slow tier, no deep run requested.
- `npm run build` — skipped, slow tier, no deep run requested.

## Run stats

Elapsed: about ten minutes from orientation to this file. Five subagents: four lens agents
(code and performance, security and existing features on sonnet; new features on the default
model) and one verifier on the default model. No lens agent reported hitting a file-open or time
cap; each listed what it left unexamined and those gaps are folded into Open questions.
