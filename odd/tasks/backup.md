# Backup: export/import the task list

Objective: file-based backup of tasks (export to JSON, validated import behind a confirmation), tokens-styled, 375px-safe · Branch: `feat/backup` (from `main`) · Runner: `pnpm vitest run <file>` (focused), `pnpm test` (suite)

## Specs

S1. Export — "Export: a button \"Export tasks\" downloads a file named \"odd-todo-backup-YYYY-MM-DD.json\" (local date) with all tasks, their completed state and order, plus a format version. It works with an empty list too."

S2. Import — "Import: a button \"Import tasks\" opens a file picker that accepts .json. The file replaces the current list only after confirmation: show \"Replace current tasks (N) with imported tasks (M)?\" with the buttons \"Replace\" and \"Cancel\". Cancel changes nothing."

S3. Invalid files — "Invalid files: a file that is not valid JSON, has an unknown format version, contains any task that breaks the todo-core S1 rules (empty after trimming, longer than 120 characters), or is larger than 1 MB is rejected entirely with \"This file can't be imported.\" and changes nothing. No partial imports."

S4. Persistence — "An imported list is persisted through src/shared/storage.ts like any other change and survives a reload."

S5. Format contract — "The file format is a contract. Propose it (fields, version, how it relates to the stored shape) and wait for my approval before writing it."
    Approved (L2): `{ format: "odd-todo-app/backup", version: 1, exportedAt: ISO string, tasks: [{id, text, completed}] }`; `tasks` is the stored shape (same elements, same order semantics); import accepts only format+version above; ids REGENERATED on import; task text stored AS-IS (validated on trimmed form); unknown fields dropped at every level.

S6. Untrusted input — "The file is untrusted input: nothing from it is rendered as HTML, and unknown fields are dropped, not kept."

S7. UI — "Styles follow AGENTS.md B5; works at 375px with no horizontal scroll."

S8. Out of scope — "Out of scope: merging an import with the current list, cloud sync, other formats (CSV), automatic backups. Do not add them."

## Tasks

- [x] T1 (all) inline · commit b67912f · this document, L1 verbatim, branch `feat/backup` · Risk: none · evidence: file (b67912f)
- [x] T2 (S3) inline · commit 73342d7 · `src/shared/taskText.ts`: extracted todo-core S1 rules (MAX 120, empty/length predicates) as pure functions; `TaskForm` consumes them · Risk: item 3 (shared rule contract consumed by TaskForm and backup) · evidence: RED→GREEN on predicates; existing TaskForm tests untouched and green (S1 behavior preserved)
- [x] T3 (S1, S3, S5, S6) inline · commits 01c0cc5 + 5ee7a06 · `src/features/backup/backupFormat.ts`: `serializeBackup(tasks, now)` + `backupFileName(now)` (local date) + `parseBackup(text, maxBytes)` whole-reject parser (version gate, per-task S1 validation, unknown fields dropped, ids regenerated, text as-is) · Risk: item 3 (the file contract) · evidence: RED→GREEN per rule incl. 120 boundary and field dropping
- [x] T4 (S4) inline · commits 6397844 + 1c907a1 · `useTasks`: add `replaceTasks(next)` with the same functional-updater persist semantics · Risk: item 3 (hook API extension) · evidence: RED→GREEN + no-write-on-mount kept
- [x] T5 (S1–S3, S6) inline · commits 0b095e7 + 5ee7a06 · `BackupControls.tsx` + module css: "Export tasks" (Blob download), "Import tasks" file input (accept .json, accessible name, reset after pick), 1 MB pre-check on File.size, confirmation panel "Replace current tasks (N) with imported tasks (M)?" + "Replace"/"Cancel" (Cancel = observable no-op), invalid → "This file can't be imported." · Risk: item 1 (the confirm gate protecting user data) · evidence: RED→GREEN per rule
- [x] T6 (S7) inline · commit b294f38 · compose in App; scanner green on new CSS · Risk: item 3 (App composition) · evidence: existing App/e2e tests green
- [x] T7 (S1–S4, S7) inline · commits bb4e56a + 5ee7a06 · e2e: export download filename + content; wipe → import → Replace → reload survives; empty-list export; invalid file leaves list AND stored bytes untouched; 375px no horizontal scroll · Risk: none (tests) · evidence: `pnpm exec playwright test`
- [x] T8 (all) inline · verifier READY (L5) · B4 gates + verifier (items 1, 3, 5 high tier) + close · Risk: verified by `verifier` · evidence: outputs + verdict

## Log

L1 2026-11-26 user (verbatim): > Add backup: export the task list to a file and import it back.
>
> Requirements:
> 1. Export: a button "Export tasks" downloads a file named "odd-todo-backup-YYYY-MM-DD.json" (local date) with all tasks, their completed state and order, plus a format version. It works with an empty list too.
> 2. Import: a button "Import tasks" opens a file picker that accepts .json. The file replaces the current list only after confirmation: show "Replace current tasks (N) with imported tasks (M)?" with the buttons "Replace" and "Cancel". Cancel changes nothing.
> 3. Invalid files: a file that is not valid JSON, has an unknown format version, contains any task that breaks the todo-core S1 rules (empty after trimming, longer than 120 characters), or is larger than 1 MB is rejected entirely with "This file can't be imported." and changes nothing. No partial imports.
> 4. An imported list is persisted through src/shared/storage.ts like any other change and survives a reload.
> 5. The file format is a contract. Propose it (fields, version, how it relates to the stored shape) and wait for my approval before writing it.
> 6. The file is untrusted input: nothing from it is rendered as HTML, and unknown fields are dropped, not kept.
> 7. Styles follow AGENTS.md B5; works at 375px with no horizontal scroll.
> 8. Out of scope: merging an import with the current list, cloud sync, other formats (CSV), automatic backups. Do not add them.
>
> Before writing anything, show me the classification, the Risk line and the task list, and wait for my go.

L2 2026-11-26 user (verbatim): > 1. regenerate ids on import,  2.as-is
>
> (resolution of the two format micro-decisions; the rest of the format and the plan approved with the subsequent go)

L3 2026-11-26 next: T2.

L4 2026-11-26 agent (process defect record): the verifier (L5) found that commits 01c0cc5, 6397844, 1c907a1 and bb4e56a carry their Risk line WITHOUT the blank-line separation, so git interpret-trailers cannot parse them — despite the convention adopted in todo-core L5.3. Not amended (no history rewrite; commits already referenced in this doc). Correction: commits from 5ee7a06 onward are trailer-parseable; this record closes the finding. The verifier's four transient probes are adopted as permanent regressions in 5ee7a06.

L5 2026-11-26 agent (verifier verdict, range b67912f..bb4e56a): READY TO MERGE contingent on the L4 trailer record, now closed. B1–B8 PASS with byte/probe evidence (strict version gate, duplicate-id regeneration, padded text kept, exact-size accept/reject, size guard before read, single storage key, zero unsafe DOM sinks, user strings byte-match, scanner+focus+375 clean, zero new deps, no out-of-scope hits). B9 PARTIAL FAIL → fixed-forward via this record + trailer-parseable footers going forward. Gates: 11 files / 64 unit tests, 8 e2e, tsc -b --force, lint, scanner, integrity, vite build — all green at HEAD 5ee7a06. Carried questions for the user (not implemented): (1) parseBackup internal guard counts UTF-16 chars, not bytes (moot while the byte-accurate File.size pre-check is used); (2) exportedAt validated as string, not ISO-parsed; (3) e2e tmp files backup-good/bad.json lack cleanup.

L6 2026-11-26 user (verbatim): > 1. Keep the internal UTF-16 guard for now. The File.size byte-accurate pre-check already protects the current import flow. Avoid unnecessary changes unless parseBackup needs to guarantee byte-accurate limits independently.
> 2. Tighten exportedAt validation. The contract explicitly specifies ISO, so validate accordingly rather than accepting arbitrary strings. Make sure the chosen validation matches the intended ISO format and timezone policy.
> 3. Add teardown for temporary E2E files. Tests should clean up their own artifacts to ensure isolation and repeatability.
>
> Please implement 2 and 3. Keep 1 documented as a known limitation for now.

L7 2026-11-26 agent: executed L6.2 and L6.3; L6.1 recorded as a known limitation.
- exportedAt (commit ad18588, Risk: item 3): ISO 8601 INSTANT required — date + time + explicit timezone (Z or ±HH:MM), real calendar value via Date.parse; lowercase t/z and fractional seconds accepted; date-only, timezone-less, garbage and impossible dates rejected (RED→GREEN; canonical toISOString output and the whole suite + e2e green). Timezone policy: export writes UTC (toISOString); import accepts any explicit-offset instant (ambiguous, timezone-less strings stay rejected).
- e2e teardown (next commit, Risk: none): pid-prefixed tempFile helper + afterEach rmSync; verified a run leaves zero files; two strays from pre-teardown runs removed manually.
- Known limitation (kept per L6.1): parseBackup's internal size guard counts UTF-16 characters, not bytes; the byte-accurate File.size pre-check covers the only current caller. Revisit if parseBackup ever faces raw bytes independently.
