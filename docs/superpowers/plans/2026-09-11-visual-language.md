# Visual Language (warm paper, green hero block) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Syllabify to the approved mockup: warm paper, a solid green hero block holding the full-size illustration, joy colours on the dates, serif headings everywhere, rounder corners. No behaviour changes.

**Architecture:** All colour and shape lives in `app/globals.css` tokens and component classes, so both themes move together. The illustration (`components/hero-art.tsx`, `lib/art.ts`) gains an ink set for green ground, dashed arrows and joy-coloured chips and days. The landing page is rebuilt from the mockup; other screens only pick up the new tokens and classes.

**Tech Stack:** Next 16, Tailwind 4 (`@theme inline`), `next/font` (Instrument Serif, Geist), Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-11-visual-language-design.md`

## Global Constraints

- Warm paper stays: `--paper #fbfaf7`; green `--accent #0d7a5c` and amber `--warn #a55a08` keep their exact values.
- Joy colours: `--joy-2` amber, `--joy-3` coral, `--joy-4` blue, as already defined in both themes.
- Tap targets 44px on phones; body type never below 14px; review rows stay stacked cards under 640px.
- Every colour pair checked against WCAG AA (3:1 for display type ≥ 24px, 4.5:1 otherwise) in both themes.
- Behaviour does not change; all 359 tests stay green. `npm test`, `npm run lint`, `npm run build` all pass before the branch is done.
- No em dashes in copy. Commit after every task with the session attribution trailer.

---

### Task 1: Tokens and component classes

**Files:**
- Modify: `app/globals.css` (`:root`, `.dark`, `@theme inline`, `@layer components`)
- Test: `lib/art.test.ts` (unchanged, still guards delay rules)

**Produces:** tokens `--hero`, `--hero-ink`, `--hero-muted`, `--joy-3-soft`; classes `.block`, `.block-hero`, `.block-soft`, `.h2`, `.h3`, `.tile`, `.tile-icon`, `.strip`, `.segmented`, `.swatch`, `.dot`; `.card` radius 1rem, `.btn` radius 0.75rem.

- [ ] **Step 1: Add tokens.** In `:root` after `--accent-glow`:

```css
  /* The hero block. Light theme paints it in the accent itself; dark needs a deep green so
     white type stays readable on it. */
  --hero: #0d7a5c;
  --hero-ink: #ffffff;
  --hero-muted: #d7efe5;
  --hero-quiet: #a9d9c6;
  --joy-3-soft: #fde4dc;
```
In `.dark` after `--accent-glow`:
```css
  --hero: #0e4a38;
  --hero-ink: #ffffff;
  --hero-muted: #c2e6d6;
  --hero-quiet: #8fc7b0;
  --joy-3-soft: #3a2119;
```
In `@theme inline` add:
```css
  --color-hero: var(--hero);
  --color-hero-ink: var(--hero-ink);
  --color-hero-muted: var(--hero-muted);
  --color-hero-quiet: var(--hero-quiet);
  --color-joy-1: var(--joy-1);
  --color-joy-2: var(--joy-2);
  --color-joy-3: var(--joy-3);
  --color-joy-4: var(--joy-4);
  --color-joy-3-soft: var(--joy-3-soft);
  --font-mono: var(--font-mono);
```

- [ ] **Step 2: Type scale.** Replace `.h1` and `.h-display` sizes and add `.h2`, `.h3`:

```css
  .h1 { font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: clamp(2.5rem, 6vw, 3.5rem); line-height: 1.02; letter-spacing: -0.025em; }
  .h-display { font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: clamp(2.75rem, 7.5vw, 4.875rem); line-height: 0.98; letter-spacing: -0.025em; text-wrap: balance; }
  .h2 { font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: clamp(2rem, 4.5vw, 2.75rem); line-height: 1.05; letter-spacing: -0.02em; }
  .h3 { font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: 1.625rem; line-height: 1.1; letter-spacing: -0.01em; }
```

- [ ] **Step 3: Shapes.** `.card` and `.card-sunk` radius `1rem`; `.btn` radius `0.75rem`; `.btn-hero` radius `0.875rem`. Add:

```css
  .block { border-radius: 1.75rem; }
  .block-hero { background: var(--hero); color: var(--hero-ink); }
  .block-soft { background: var(--accent-soft); }
  .btn-on-hero { background: var(--hero-ink); color: var(--accent-strong); }
  .btn-on-hero:hover:not(:disabled) { background: var(--hero-muted); }
  .btn-ghost-on-hero { color: var(--hero-ink); border: 1.5px solid color-mix(in oklab, var(--hero-ink) 45%, transparent); }
  .btn-ghost-on-hero:hover:not(:disabled) { border-color: var(--hero-ink); }
  .tile { border-radius: 1.25rem; padding: 1.75rem; }
  .tile-icon { display: inline-flex; width: 2.75rem; height: 2.75rem; align-items: center; justify-content: center; border-radius: 0.75rem; }
  .strip { background: var(--sunk); border-bottom: 1px solid var(--line); }
  .segmented { display: inline-flex; overflow: hidden; border: 1px solid var(--line-strong); border-radius: 0.625rem; background: var(--elev); }
  .segmented > .btn { border-radius: 0; border: 0; }
  .segmented > .btn + .btn { border-left: 1px solid var(--line-strong); }
  .dot { display: inline-block; width: 0.625rem; height: 0.625rem; border-radius: 0.1875rem; flex: none; }
```
At phone width `.block { border-radius: 1.25rem; }` and `.tile { padding: 1.25rem; }` inside the existing `@media (max-width: 639px)` block.

- [ ] **Step 4: Run** `npm test -- lib/art.test.ts` → PASS (delay rules untouched). **Commit** `style: tokens and shapes for the warm green language`.

---

### Task 2: The illustration on green, with arrows and joy colours

**Files:**
- Modify: `lib/art.ts` (add `HERO_INK`, `JOY`, `ARROWS`), `components/hero-art.tsx` (arrows, joy fills, `onHero` prop), `app/globals.css` (arrow draw animation + reduced motion)
- Test: `lib/art.test.ts`

**Produces:** `HeroArt({ className?, onHero?: boolean })`; `ArtInk.arrow`; `JOY: [string,string,string]`; `ARROWS: {d: string}[]` (3).

- [ ] **Step 1: Failing test** in `lib/art.test.ts`:

```ts
import { ARROWS, HERO_INK, JOY } from "./art";
it("draws one arrow per date in flight, each leaving the sheet and reaching the calendar", () => {
  expect(ARROWS).toHaveLength(3);
  for (const a of ARROWS) {
    const nums = a.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(nums[0]).toBeGreaterThanOrEqual(SHEET.x + SHEET.w);
    expect(nums[nums.length - 2]).toBeLessThanOrEqual(CAL.x);
  }
});
it("has three joy colours, one per date in flight", () => {
  expect(JOY).toHaveLength(3);
  expect(HERO_INK.arrow).toBeTruthy();
});
```
Run `npm test -- lib/art.test.ts` → FAIL (no export).

- [ ] **Step 2: lib/art.ts.** Add `arrow: string` to `ArtInk` (set `"var(--line-strong)"` in `THEME_INK`, `"#d4cec0"` in `LIGHT_INK`), and:

```ts
/** The three dates in flight take the joy colours, and the days they land on take them back. */
export const JOY = ["var(--joy-2)", "var(--joy-3)", "var(--joy-4)"] as const;
/** Dashed flight paths, sheet edge to calendar edge, one per chip. */
export const ARROWS = [
  { d: `M${SHEET.x + SHEET.w + 2} 66 C 160 66, 180 44, ${CAL.x - 8} 44` },
  { d: `M${SHEET.x + SHEET.w + 2} 92 C 165 92, 175 90, ${CAL.x - 8} 90` },
  { d: `M${SHEET.x + SHEET.w + 2} 118 C 160 118, 180 136, ${CAL.x - 8} 136` },
];
/** On the green hero block the paper is white and its lines pale green. */
export const HERO_INK: ArtInk = {
  surface: "#ffffff", line: "#cfe9dd", sunk: "#eef5f1",
  accent: "var(--accent)", deep: "var(--accent-strong)", ink: "#ffffff",
  arrow: "rgba(255,255,255,0.8)",
};
```

- [ ] **Step 3: hero-art.tsx.** `Chips` fills chip `i` with `JOY[i]` when `joy` is true; `Calendar` fills `hit.order` with `JOY[hit.order] ?? ink.accent`. Add `Arrows({ ink, still })` rendering `<path d className="art-arrow art-arrow-i" fill="none" stroke={ink.arrow} strokeWidth="1.75" strokeDasharray="4 5" markerEnd="url(#art-arrowhead)">` plus a `<defs><marker id="art-arrowhead" ...>` with `fill={ink.arrow}`. `HeroArt({ className, onHero })` uses `onHero ? HERO_INK : THEME_INK` and renders Sheet, Arrows, Chips, Calendar in that order, passing `joy`. `ArtCrop` unchanged (still, theme ink).

- [ ] **Step 4: CSS.** Add `@keyframes draw-arrow { from { stroke-dashoffset: 240; opacity: 0 } 10% { opacity: 1 } to { stroke-dashoffset: 0; opacity: 1 } }`, `.hero-art .art-arrow { stroke-dashoffset: 240; animation: draw-arrow 0.9s cubic-bezier(0.4,0,0.3,1) both; }`, delays `.art-arrow-0 { animation-delay: 300ms } .art-arrow-1 { 730ms } .art-arrow-2 { 1160ms }` (50ms ahead of each chip). Add `.hero-art .art-arrow` to the reduced-motion `animation: none` list with `stroke-dashoffset: 0; opacity: 1`. Update the `art.test.ts` regex expectation to include arrows: expected list gets `[0,1,2].map(i => [`art-arrow-${i}`, 300 + i*430])` and the regex becomes `/\.hero-art \.(art-(?:line|chip|cell|arrow)-\d+) \{/g`.

- [ ] **Step 5: Run** `npm test -- lib/art.test.ts components/landing.test.tsx` → PASS. **Commit** `feat: the illustration flies its dates on arrows, in the joy colours`.

---

### Task 3: Landing page from the mockup

**Files:**
- Modify: `components/landing.tsx`
- Delete: `components/how-it-works.tsx`
- Test: `components/landing.test.tsx`

- [ ] **Step 1: Test.** In `landing.test.tsx` add:
```tsx
it('makes its case once at the top and once at the bottom, nowhere in between', () => {
  render(<Landing dispatch={() => {}} />)
  expect(screen.getAllByRole('button', { name: /add my syllabi/i })).toHaveLength(2)
  expect(screen.queryByText(/how it works/i)).toBeNull()
})
```
Run → FAIL (three buttons today).

- [ ] **Step 2: Rewrite `Landing`.** Structure, using the classes from Task 1:

```tsx
<div className="step-enter">
  <section className="block block-hero grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-16 lg:py-16">
    <div>
      <h1 className="h-display">Your whole semester, on your calendar, <em className="text-joy-2">in one minute.</em></h1>
      <p className="mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-hero-muted sm:text-lg">Drop the syllabi …single file.</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button onClick={start} className="btn btn-on-hero btn-hero">Add my syllabi <ArrowRight size={18} /></button>
        <button onClick={sample} className="btn btn-ghost-on-hero btn-hero">See it on a sample</button>
      </div>
      <p className="mt-4 text-sm text-hero-quiet">Free forever. No sign-up. Nothing to install.</p>
    </div>
    <HeroArt onHero className="order-first mx-auto w-full max-w-md lg:order-none lg:max-w-none" />
  </section>

  <div className="mt-20 sm:mt-24"><ExtractDemo onSample={sample} /></div>

  <ul className="stagger mt-16 grid gap-4 sm:grid-cols-3">
    {PROOF.map(({ icon: Icon, label, detail, tint, iconBg, iconInk }) => (
      <li key={label} className={`tile ${tint}`}>
        <span className={`tile-icon ${iconBg} ${iconInk}`}><Icon size={20} /></span>
        <h2 className="h3 mt-4">{label}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed">{detail}</p>
      </li>
    ))}
  </ul>

  <section className="mt-20">
    <h2 className="h2">What makes this different</h2>
    <p className="lede mt-2">There are a dozen apps…</p>
    <div className="card mt-6 overflow-x-auto">
      <table> … thead row gets className="strip …" and the rest of the table is unchanged … </table>
    </div>
  </section>

  <section className="block block-soft mt-20 px-6 py-12 text-center sm:py-14">
    <h2 className="h2">Ready when you are</h2>
    <p className="lede mx-auto mt-2">One file, about a minute, and you are done for the term.</p>
    <button onClick={start} className="btn btn-primary btn-hero mt-6">Add my syllabi <ArrowRight size={18} /></button>
    <div className="mt-8 flex flex-col items-center gap-2"><p className="text-sm text-muted">This is free…</p><SupportLink /></div>
  </section>
</div>
```
`PROOF` gains `tint: 'bg-accent-soft' | 'bg-warn-soft' | 'bg-joy-3-soft'`, `iconBg: 'bg-accent' | 'bg-joy-2' | 'bg-joy-3'`, `iconInk: 'text-accent-ink' | 'text-[#5a3d00]' | 'text-white'`. Remove the `HowItWorks` import and section and the middle call to action. Keep the demo's own "Try it on a sample" button (the tests rely on it).

- [ ] **Step 3:** `git rm components/how-it-works.tsx`. Run `npm test -- components/landing.test.tsx components/extract-demo.test.tsx app/page.test.tsx` → PASS. **Commit** `feat: the front page opens on a green block with the picture inside it`.

---

### Task 4: The demonstration panel

**Files:**
- Modify: `components/extract-demo.tsx`
- Test: `components/extract-demo.test.tsx` (existing assertions must keep passing)

- [ ] **Step 1:** Heading `className="h2 text-center"`. Each found row gets a leading `<span className="dot" style>`; no inline styles are allowed by the CSP, so use classes: `const DOT = ['bg-joy-2', 'bg-joy-4', 'bg-joy-3', 'bg-accent']` and pick `DOT[index % 4]`, with `aria-hidden`. Date span becomes `font-mono text-[0.8125rem] font-medium text-accent w-[5.25rem] whitespace-nowrap` (so "Oct 20–21" never wraps; the test `getByText('Oct 20–21')` stays exact). The "also read" cards keep `card` (now 1rem radius).
- [ ] **Step 2:** `npm test -- components/extract-demo.test.tsx` → PASS. **Commit** `style: the demonstration wears the joy colours`.

---

### Task 5: Review step

**Files:**
- Modify: `components/review-step.tsx`, `components/review-table.tsx`
- Test: `components/review-step.test.tsx`, `components/review-table.test.tsx` (unchanged)

- [ ] **Step 1:** In `review-step.tsx`: the list wrapper becomes `card mt-4 overflow-hidden`; the toolbar row becomes `strip flex flex-wrap items-center gap-1.5 px-4 py-3 text-xs sm:px-5`; wrap the All / None / Needs check buttons in `<div className="segmented">` (buttons keep their `aria-pressed` and labels); the table gets `px-4 pb-4 sm:px-5`. Active class tab `rounded-[0.625rem]`.
- [ ] **Step 2:** In `review-table.tsx`: date and time inputs add `font-mono text-[0.875rem]`. Flagged rows keep `bg-warn-soft/50`.
- [ ] **Step 3:** `npm test -- components/review-step.test.tsx components/review-table.test.tsx` → PASS. **Commit** `style: the review list gets a header strip and one segmented control`.

---

### Task 6: Upload, export, 404 pick up the vocabulary

**Files:**
- Modify: `components/file-drop.tsx` (hero drop zone `rounded-2xl`), `components/export-step.tsx` (payoff header `strip`→ keep `bg-accent-soft/60`, "Done." and count lines use `h2`), `app/not-found.tsx` (no change needed beyond classes already updated)

- [ ] **Step 1:** Apply the two class edits. Run `npm test` (all) → PASS. **Commit** `style: upload and export follow the new shapes`.

---

### Task 7: Verify in a browser, both widths, both themes

- [ ] **Step 1:** `npm run lint && npm run build` → clean.
- [ ] **Step 2:** Start `npm run dev` in the foreground of a background Bash task on port 3000 (never detached), screenshot `/` at 1440 and 390 wide, and with `document.documentElement.classList.add('dark')` at 1440. Compare to the mockup. Check the hero animation runs once and holds.
- [ ] **Step 3:** Contrast, computed not guessed: white on `#0d7a5c` (≥4.5), `#d7efe5` on `#0d7a5c` (≥4.5), `#f5b841` on `#0d7a5c` (≥3, display only), white on `#0e4a38`, `#c2e6d6` on `#0e4a38`, `#f5c65f` on `#0e4a38`. Any failure adjusts the token, not the copy.
- [ ] **Step 4:** Stop the dev server. Final `npm test` → 359+ passing. **Commit** anything from the browser pass as `fix:`.
