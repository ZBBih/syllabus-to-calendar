# Syllabify guided flow — Design

Date: 2026-09-05. Supersedes the single-page layout in the 2026-09-05 syllabus-to-calendar design.

## Goal
Replace the long scrolling page with a three-step guided flow (Upload → Review → Export) that works on a phone, drops the gradient for flat surfaces, adds a three-way theme control that follows the OS, makes inputs clearable, and adds review bulk actions, per-class export, and PWA install/offline.

## State additions (`lib/store.ts`)
- `step: 1 | 2 | 3` (persisted). `activeCourseId: string | null` (persisted).
- Actions: `setStep`, `setActive`, `setIncludeAll(courseId, include)`.
- `sanitize` accepts and defaults both fields.

## Shell
- `app/layout.tsx` unchanged except manifest link. `app/manifest.ts` returns name, short_name, icons (`/icon.svg`, `/apple-icon`), theme/background colors, `display: standalone`.
- `public/sw.js`: cache-first for same-origin GET of the shell (`/`, `/_next/static/*`, icons). Registered from the page after load, production only.
- `components/theme-control.tsx`: segmented System / Light / Dark. Stored at `stc:theme` as `system|light|dark`; System removes the override and follows `prefers-color-scheme` live. The inline head script honours the same key.
- `components/stepper.tsx`: three items with number or check, current is amber, completed are clickable. Completion: step 1 done when any course has a name and ≥1 event; step 2 done when the user has visited it.
- Background: flat `--bg` (warm neutral), cards `--elev`. Amber only for primary actions, active step, and attention states.

## Step 1: Upload (`components/upload-step.tsx`)
- Hero `FileDrop multiple` at top; "Try a sample" link when the list is empty.
- `components/class-row.tsx` per course: icon, name input with a clear button (visible when non-empty), term + year selects, count pill ("12 dates" / "no dates yet"), remove button (hidden when it is the only course and empty).
- "Add by pasting" opens `components/paste-sheet.tsx` (dialog): name, term, textarea, Save → `addFromFiles` with the typed name. Re-open with a course id to edit its text; Save → `update` + `mergeEvents`.
- Footer: Next → step 2, enabled when any course has a name and ≥1 event.

## Step 2: Review (`components/review-step.tsx`)
- Tabs from courses with events; each tab shows name and an amber count of low-confidence rows. `activeCourseId` selects.
- Toolbar: Select all, Select none, "Needs check" filter toggle (client state), Add row, Edit text (opens paste sheet for that course).
- `components/review-table.tsx` renders the rows (filtered when toggle on).
- Disclosure "All classes by date" wrapping `DatePreview`.
- Footer: Back, Next → step 3.

## Step 3: Export (`components/export-step.tsx`)
- Reminder select. Buttons: Send to my calendar (when `canShare`), Download all (`syllabify.ics`), Download one class (menu → `<name>.ics`). `buildIcs` is reused per course.
- Import guide tabs unchanged. Footer: Back, Start over (confirm).

## Removed
- Background gradient, `StepHeading`, the per-card textarea and drop zone (moved to the sheet), the two-way toggle.

## Testing
- Store: setStep/setActive/setIncludeAll, sanitize defaults.
- Components (jsdom): stepper completion, class-row clear button, review toolbar select all/none and filter, export per-class menu builds one file per course.
- Browser: all three steps light and dark at desktop and 390px widths; PWA manifest and sw fetch 200 in production build.
