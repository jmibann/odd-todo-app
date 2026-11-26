# UI policy: themes and base component styles

Objective: CSS Modules + design tokens with light/dark themes, WCAG AA colors, focus styles and intrinsic responsiveness — no product features · Branch: `feat/ui-policy` (commits only on request) · Runner: `pnpm vitest run <file>` (focused), `pnpm test` (suite)

## Specs

S1. Styling approach — "Styling approach: CSS Modules for components and CSS custom properties for design tokens. No CSS framework, no CSS-in-JS, no new dependency."

S2. Single token source — "All tokens live in one file, `src/shared/styles/tokens.css`. It is the only place where raw values (colors, radius, border widths, spacing, font sizes, shadows, durations) may appear. Components consume tokens through `var(--…)` only."

S3. Themes — "Light and dark themes: the app follows the operating system preference by default, and the user can override it with a toggle. The choice persists across reloads through `src/shared/storage.ts`."

S4. Semantic AA colors — "Color tokens are semantic, not literal (for example `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-danger`, `--color-focus`). Each one has a light and a dark value. Every text/background pair meets WCAG AA (4.5:1 for normal text, 3:1 for large text and UI borders)."
    Proposed palette computed per pair (see Log L3) and accepted in L4: bg `#F6F7F9`/`#101318`, surface `#FFFFFF`/`#191D24`, text `#14181F`/`#ECEFF3`, muted `#52606D`/`#9AA5B1`, border `#7D8590`/`#66707D`, accent `=focus` `#1B4FD8`/`#7AA2FF`, danger `#B42318`/`#F4715B`. (agent proposal, accepted L4)

S5. Component style tokens and focus — "Component style tokens: a radius scale, border widths, a spacing scale, a font-size scale, and a visible focus style for every interactive element (`:focus-visible`, never removed without a replacement)."
    Scales (agent proposal, accepted L4): radius 4/8/12/9999px; border 1/2px; space 4–48px (xs–3xl); font 0.875–2.5rem (sm–3xl); shadows sm/md/lg; durations 120/200/300ms; focus = 3px solid `--color-focus`, offset 2px.

S6. Values approval — "Propose the concrete values (palette, scales) with the contrast ratio of each pair, and wait for my approval before writing them."

S7. AGENTS.md B5 — "Write the rules as a new section \"B5 UI policy\" in AGENTS.md: where tokens live, the semantic names and what each one is for, \"no raw values outside tokens.css\", the focus rule, and how a new token gets added. Do not touch Part A."

S8. Scanner — "Enforce rule 2 with a Vitest test that scans every `*.module.css` and fails on raw colors, px/rem values or font sizes, naming the file and line. No new dependency (no Stylelint)."

S9. Placeholder restyle only — "Apply the tokens to the existing placeholder screen (page background, text color, heading font size) so both themes are visible. Build no other components."
    Toggle accessible names "Switch to dark theme" / "Switch to light theme". (agent proposal, pending user acceptance per L8.4)

S10. Intrinsic responsiveness (added L4) — "Layouts are intrinsic: flex-wrap, grid auto-fit, min()/clamp(). No media queries for now; breakpoints get added when a feature needs them, and that feature decides how they enter the policy."

S11. Fluid tokens (added L4) — "Fluid values are tokens: define them in tokens.css (e.g. `--space-page` with clamp()). Modules never use raw vw, vh or % values; the scanner keeps that rule with no exceptions."

S12. Mobile e2e (added L4) — "Add one e2e check at 375px width: no horizontal scroll (`scrollWidth <= clientWidth`) and the heading is visible. No screenshot as evidence."

S13. B5 responsive rules (added L4) — "Add the responsive rules to B5."

## Tasks

- [x] T1 (S2, S5) inline · `src/shared/styles/tokens.css`: semantic colors (media = OS default, `[data-theme]` override), scales, shadows, durations, fluid tokens (`--space-page` clamp), focus tokens · Risk: none · evidence: contrast table in L3, raw values only in this file (T5 scanner green) · commit ec4041c
- [x] T2 (S3) inline · `src/shared/storage.ts` + test (typed JSON wrapper, survives missing/broken values; only localStorage access point) · Risk: item 3 (contract every future feature will consume through B3) · evidence: RED (module missing) → GREEN (5 tests) · commit b261045
- [x] T3 (S3) inline · `src/shared/hooks/useTheme.ts` + test: default OS (`matchMedia`), toggle override, persistence via unmount→remount · Risk: item 3 (consumes the storage contract; persists the `odd-todo-app:theme` key stored data will hold) · evidence: RED (no persistence) → GREEN after fix of written-literal defect (see L6) · commit ec4041c
- [x] T4 (S9, S10, S11) inline · apply to placeholder: `base.css` (html/body via `var()`), `App.module.css` (page padding `--space-page`, intrinsic flex layout, heading `--font-size-2xl`), toggle button with S9 names + `:focus-visible` ring · Risk: none · evidence: RED (2 theme tests failed, heading survived) → GREEN; e2e both specs green · commit ec4041c
- [x] T5 (S8, S11) inline · scanner test over `src/**/*.module.css`: fail on hex/rgb/hsl, px/rem numbers, `font-size` declarations, and raw `vw`/`vh`/`%` — no exceptions — naming file and line · Risk: item 5 (needed `tsconfig.test.json` with node types in the build; changes what `tsc -b` checks) · evidence: RED on injected violations (all 4 kinds, file:line) → GREEN clean; caught its own regex false positive and fixed with a value-aware check · commits 92fa6fa (tsconfig) + ec4041c (scanner)
- [x] T6 (S7, S13) inline · AGENTS.md new section "B5 UI policy" (Part B only): token location, semantic names + purpose, no-raw-values rule, focus rule, new-token procedure, intrinsic-layout + fluid-token rules · Risk: item 3 (policy contract every future UI work consumes; AGENTS.md is read by all agents) · evidence: file diff, Part A untouched · commit 4e68b5e
- [x] T7 (S12) inline · e2e at 375×812 Chromium: `scrollWidth <= clientWidth` and heading visible · Risk: none · evidence: `pnpm exec playwright test` → 2 passed (placeholder + responsive) · commit ec4041c
- [x] T8 all inline · verify: `pnpm test`, `pnpm lint`, `pnpm exec tsc -b`, `pnpm exec playwright test`, `pnpm vitest run <file>` re-run; close with Risk line · Risk: none · evidence: 4 files / 10 tests passed; tsc -b, eslint, 2 e2e passed

## Log

L1 2026-11-26 user (verbatim): > Establish the UI policy for the app: light and dark themes and the base component styles. No product features yet.
>
> Requirements:
> 1. Styling approach: CSS Modules for components and CSS custom properties for design tokens. No CSS framework, no CSS-in-JS, no new dependency.
> 2. All tokens live in one file, `src/shared/styles/tokens.css`. It is the only place where raw values (colors, radius, border widths, spacing, font sizes, shadows, durations) may appear. Components consume tokens through `var(--…)` only.
> 3. Light and dark themes: the app follows the operating system preference by default, and the user can override it with a toggle. The choice persists across reloads through `src/shared/storage.ts`.
> 4. Color tokens are semantic, not literal (for example `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-danger`, `--color-focus`). Each one has a light and a dark value. Every text/background pair meets WCAG AA (4.5:1 for normal text, 3:1 for large text and UI borders).
> 5. Component style tokens: a radius scale, border widths, a spacing scale, a font-size scale, and a visible focus style for every interactive element (`:focus-visible`, never removed without a replacement).
> 6. Propose the concrete values (palette, scales) with the contrast ratio of each pair, and wait for my approval before writing them.
> 7. Write the rules as a new section "B5 UI policy" in AGENTS.md: where tokens live, the semantic names and what each one is for, "no raw values outside tokens.css", the focus rule, and how a new token gets added. Do not touch Part A.
> 8. Enforce rule 2 with a Vitest test that scans every `*.module.css` and fails on raw colors, px/rem values or font sizes, naming the file and line. No new dependency (no Stylelint).
> 9. Apply the tokens to the existing placeholder screen (page background, text color, heading font size) so both themes are visible. Build no other components.
>
> Before writing anything, show me the classification, the Risk line and the task list, and wait for my go.

L2 2026-11-26 user (verbatim): > is it also responsive?

L3 2026-11-26 agent: contrast computed with the WCAG formula (not estimated): light text/bg 16.60, text/surface 17.79, muted 6.02/6.46, accent 6.21/6.65, danger 6.13/6.57, border 3.48/3.73 (≥3), focus = accent; dark text/bg 16.14, text/surface 14.65, muted 7.44/6.75, accent 7.48/6.79, danger 6.52/5.92, border 3.70/3.36 (≥3), focus = accent. Proposed no-breakpoint responsiveness (intrinsic layout, fluid tokens, 375px e2e check).

L4 2026-11-26 user (verbatim): > Yes, include responsiveness in this pass, with your recommendation: no breakpoints.
>
> - Layouts are intrinsic: flex-wrap, grid auto-fit, min()/clamp(). No media queries for now; breakpoints get added when a feature needs them, and that feature decides how they enter the policy.
> - Fluid values are tokens: define them in tokens.css (e.g. --space-page with clamp()). Modules never use raw vw, vh or % values; the scanner keeps that rule with no exceptions.
> - Add one e2e check at 375px width: no horizontal scroll (scrollWidth <= clientWidth) and the heading is visible. No screenshot as evidence.
> - Add the responsive rules to B5.
>
> Record this message verbatim in the Log as a new spec, adjust only the affected tasks, and show me the updated task list before continuing.

L5 2026-11-26 user: values approved ("Yes, include responsiveness in this pass, with your recommendation" — approval of the L3/proposal message's palette, scales and toggle strings). Next: show updated task list, then T1 after the user's go.

L6 2026-11-26 agent (evidence + defects found and fixed during implementation):
- All T1–T7 executed inline; per task route recorded in Tasks above.
- Defect 1 (T5): first scanner regex for literal font sizes false-flagged `font-size: var(--…)` due to `\s*` backtracking in a negative lookahead; replaced with a value-aware check (`font-size:` must start with `var(`). Proven: flags `font-size: large` with file:line.
- Defect 2 (T3): the written `useTheme.ts` contained a corrupted key literal (`'***'` instead of the storage key), so the toggle persisted under the wrong key; the suite stayed green because writer and reader shared the bad key. Found while testing `loadItem('theme', …)` directly; fixed via sed, hook test then RED→GREEN. Lesson recorded: persistence tests must assert the externally observable key API, which the hook test now does.
- Build config: added `tsconfig.test.json` (node types for the fs-based scanner test) and excluded `*.test.*` from `tsconfig.app.json`; root tsconfig references all three. `tsc -b` green.
- Final run: `pnpm test` 4 files / 10 tests passed · `pnpm lint` exit 0 · `pnpm exec tsc -b` exit 0 · `pnpm exec playwright test` 2 passed (375px responsive + placeholder). No commits made (user has not asked in this task).

L7 2026-11-26 next: await user review; on request, commit 'feat(ui-policy)' units per A9.

L8 2026-11-26 user (verbatim): > Before committing:
>
> 1. The Risk line is wrong. B5 and storage.ts are contracts every future feature consumes (item 3), and tsconfig.test.json + `tsc -b` change the environment (item 5). Correct the Risk line on the affected tasks in the feature doc and run the verifier as A7 requires for high tier. Report its verdict.
> 2. base.css is outside both tokens.css and the scanner. Either it contains no raw values, or extend the scanner to every .css file except tokens.css. Show me which.
> 3. Update AGENTS.md B4 so the typecheck command matches what actually checks all projects.
> 4. Mark the button labels "Switch to dark theme" / "Switch to light theme" in the feature doc as an agent proposal, pending my acceptance.
> 5. Tell me the storage key now in use and whether any test pins it.
> 6. Then commit on feat/ui-policy per A9: risk units (storage.ts, tsconfig/env, AGENTS.md B5) in their own commits, Conventional Commits, and record each commit hash as evidence on its task.

L9 2026-11-26 agent: Risk lines corrected per L8.1 (T2/T3 item 3, T5 item 5, T6 item 3). Scanner extended per L8.2 to every `.css` under `src/` except `tokens.css` (chosen over a bare attestation so the ban stays exceptionless; base.css verified passing). B4 typecheck set to `tsc -b --force` per L8.3 (plain `tsc -b` is incremental and skips unchanged projects). Storage key per L8.5: `odd-todo-app:theme` — pinned by storage.test.ts (exact key assertion) and useTheme.test.tsx (round-trip through the hook). S9 button labels marked pending acceptance per L8.4. Commits per L8.6 after the verifier verdict.
