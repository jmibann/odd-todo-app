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

- [ ] T1 (all) inline · this document, L1 verbatim, branch `feat/backup` · Risk: none · evidence: file
- [ ] T2 (S3) inline · `src/shared/taskText.ts`: extracted todo-core S1 rules (MAX 120, empty/length predicates) as pure functions; `TaskForm` consumes them · Risk: item 3 (shared rule contract consumed by TaskForm and backup) · evidence: RED→GREEN on predicates; existing TaskForm tests untouched and green (S1 behavior preserved)
- [ ] T3 (S1, S3, S5, S6) inline · `src/features/backup/backupFormat.ts`: `serializeBackup(tasks, now)` + `backupFileName(now)` (local date) + `parseBackup(text, maxBytes)` whole-reject parser (version gate, per-task S1 validation, unknown fields dropped, ids regenerated, text as-is) · Risk: item 3 (the file contract) · evidence: RED→GREEN per rule incl. 120 boundary and field dropping
- [ ] T4 (S4) inline · `useTasks`: add `replaceTasks(next)` with the same functional-updater persist semantics · Risk: item 3 (hook API extension) · evidence: RED→GREEN + no-write-on-mount kept
- [ ] T5 (S1–S3, S6) inline · `BackupControls.tsx` + module css: "Export tasks" (Blob download), "Import tasks" file input (accept .json, accessible name, reset after pick), 1 MB pre-check on File.size, confirmation panel "Replace current tasks (N) with imported tasks (M)?" + "Replace"/"Cancel" (Cancel = observable no-op), invalid → "This file can't be imported." · Risk: item 1 (the confirm gate protecting user data) · evidence: RED→GREEN per rule
- [ ] T6 (S7) inline · compose in App; scanner green on new CSS · Risk: item 3 (App composition) · evidence: existing App/e2e tests green
- [ ] T7 (S1–S4, S7) inline · e2e: export download filename + content; wipe → import → Replace → reload survives; empty-list export; invalid file leaves list AND stored bytes untouched; 375px no horizontal scroll · Risk: none (tests) · evidence: `pnpm exec playwright test`
- [ ] T8 (all) inline · B4 gates + verifier (items 1, 3, 5 high tier) + close · Risk: verified by `verifier` · evidence: outputs + verdict

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
