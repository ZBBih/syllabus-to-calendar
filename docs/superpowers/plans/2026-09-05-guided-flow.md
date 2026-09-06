# Guided flow implementation plan

> For agentic workers: execute inline with superpowers:executing-plans. Spec: docs/superpowers/specs/2026-09-05-guided-flow-design.md

**Goal:** Ship the three-step guided flow with flat surfaces, three-way theme, clearable inputs, bulk review actions, per-class export, PWA.

## Global constraints
- lib/ logic unchanged except store additions. Tests first for store and components. No gradient anywhere. Amber only for actions/attention.

### Task 1: Store additions + tests
- add `step`, `activeCourseId`, actions `setStep`, `setActive`, `setIncludeAll`; sanitize defaults; tests in lib/store.test.ts. Commit.

### Task 2: Theme control + CSS + manifest + service worker
- components/theme-control.tsx (segmented, `stc:theme` = system|light|dark), head script update, globals.css flat palette, app/manifest.ts, public/sw.js + registration. Commit.

### Task 3: Upload step
- components/stepper.tsx, class-row.tsx (clear button), paste-sheet.tsx (dialog), upload-step.tsx. Tests: stepper completion, class-row clear. Commit.

### Task 4: Review step
- review-step.tsx with tabs + toolbar; review-table.tsx accepts `rows` filter; store `setIncludeAll`. Tests: select all/none, needs-check filter. Commit.

### Task 5: Export step
- export-step.tsx: reminder, share, download all, per-class menu. Test: per-class file name and content. Commit.

### Task 6: Page assembly, verification, deploy
- app/page.tsx renders stepper + active step; remove old components; lint/tsc/test/build; browser screenshots 3 steps × 2 themes + 390px; push; `vercel deploy --prod --yes`. Commit.
