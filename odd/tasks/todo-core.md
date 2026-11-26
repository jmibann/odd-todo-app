# Todo core: add, complete, delete, persisted

Objective: the working to-do list (add/complete/delete, newest-first, persisted) on the B5 UI policy · Branch: `feat/todo-core` (stacked on `feat/ui-policy`) · Runner: `pnpm vitest run <file>` (focused), `pnpm test` (suite)

## Specs

S1. Add — "Add a task: a text input labeled \"New task\" and a button \"Add\". Pressing Enter in the input also adds. The text is trimmed. Empty or whitespace-only input adds nothing and shows \"Write a task first.\". Text longer than 120 characters (after trimming) adds nothing and shows \"Keep it to 120 characters or fewer.\". Exactly 120 characters is valid. After a successful add, the input is cleared, keeps focus, and any error message disappears. Duplicate texts are allowed."

S2. List — "List: tasks appear as a list, newest first. When there are no tasks, show \"No tasks yet.\"."

S3. Complete — "Complete a task: each task has a checkbox whose accessible name is the task text. Checking it marks the task as completed (line-through and muted text color, using B5 tokens); unchecking restores it."

S4. Delete — "Delete a task: each task has a button \"Delete\" whose accessible name is \"Delete <task text>\". It removes the task immediately, no confirmation."

S5. Persistence — "Persistence: tasks, including their completed state and order, survive a reload, through src/shared/storage.ts only. If the stored value is missing or invalid, the app shows an empty list and does not overwrite the stored value until the user changes the list. Propose the storage key and the stored data shape, and wait for my approval before writing them."
    Approved design (L2): key `tasks` (full `odd-todo-app:tasks` array in display order (newest first) of `{ id: string, text: string, completed: boolean }`; **whole-reject** validation: any non-conforming value → empty view, stored entry untouched until a user mutation.

S6. UI — "Styles follow AGENTS.md B5: tokens only, layout works at 375px with no horizontal scroll. Replace the placeholder screen; keep the \"odd-todo-app\" heading and the theme toggle."

S7. Out of scope — "Out of scope: editing a task, filters, reordering, \"clear completed\", counters, sync, undo. Do not add them."

## Tasks

- [x] T1 (all) inline · commit 25d614d · this document, L1 verbatim · Risk: none · evidence: file
- [x] T2 (S5) inline · commit fde6658 · `src/features/todo/useTasks.ts` + `useTasks.test.tsx`: load/add/toggle/remove; valid-shape load; whole-reject → empty view; NO write on mount, writes only on user mutation; round-trip via unmount→remount · Risk: items 1+3 (new stored data shape; shared hook contract) · evidence: RED→GREEN
- [x] T3 (S1) inline · commit b223d25 · `TaskForm.tsx` + test: label "New task", "Add", Enter adds, trim, empty/ws → "Write a task first.", >120 → "Keep it to 120 characters or fewer.", exactly 120 valid, clear+focus kept, error clears, duplicates allowed · Risk: item 3 (form contract: trimmed text in, none out) · evidence: RED (module missing) → GREEN (8 tests)
- [x] T4 (S2) inline · commit eebed5b · `TaskList.tsx` + test: list, newest first, "No tasks yet." · Risk: none · evidence: RED→GREEN
- [x] T5 (S3) inline · commit eebed5b + computed-style e2e 994b124 · `TaskItem.tsx` + test: checkbox named by task text, completed → line-through + muted token styles, uncheck restores · Risk: none · evidence: RED→GREEN + browser check
- [x] T6 (S4) inline · commit eebed5b + e2e 994b124 · delete button `Delete <task text>` in TaskItem + test: immediate removal, survives remount · Risk: none · evidence: RED→GREEN
- [x] T7 (S6, S7) inline · commit dcf1c4f · compose in `src/app/App.tsx` (heading + toggle kept, placeholder body replaced), `Todo.module.css` tokens-only (scanner enforces) · Risk: item 3 (App composition consumed by existing smoke/e2e tests) · evidence: existing App tests stay green; browser check both themes
- [x] T8 (S5, S6) inline · commit 994b124 · e2e: add→complete→delete→reload survives; 375px with tasks, no horizontal scroll · Risk: none · evidence: `pnpm exec playwright test`
- [x] T9 (all) inline · B4 gates + verifier subagent (items 1+3 → high tier A7) + close · Risk: items 1+3 verified by `verifier` — READY, all probes pass (verdict in L5) · evidence: 8 files/37 unit, 5 e2e, tsc -b --force, lint, scanner, integrity, vite build all green at HEAD

## Log

L1 2026-11-26 user (verbatim): > Build the core to-do list: add, complete and delete tasks, persisted across reloads.
>
> Requirements:
> 1. Add a task: a text input labeled "New task" and a button "Add". Pressing Enter in the input also adds. The text is trimmed. Empty or whitespace-only input adds nothing and shows "Write a task first.". Text longer than 120 characters (after trimming) adds nothing and shows "Keep it to 120 characters or fewer.". Exactly 120 characters is valid. After a successful add, the input is cleared, keeps focus, and any error message disappears. Duplicate texts are allowed.
> 2. List: tasks appear as a list, newest first. When there are no tasks, show "No tasks yet.".
> 3. Complete a task: each task has a checkbox whose accessible name is the task text. Checking it marks the task as completed (line-through and muted text color, using B5 tokens); unchecking restores it.
> 4. Delete a task: each task has a button "Delete" whose accessible name is "Delete <task text>". It removes the task immediately, no confirmation.
> 5. Persistence: tasks, including their completed state and order, survive a reload, through src/shared/storage.ts only. If the stored value is missing or invalid, the app shows an empty list and does not overwrite the stored value until the user changes the list. Propose the storage key and the stored data shape, and wait for my approval before writing them.
> 6. Styles follow AGENTS.md B5: tokens only, layout works at 375px with no horizontal scroll. Replace the placeholder screen; keep the "odd-todo-app" heading and the theme toggle.
> 7. Out of scope: editing a task, filters, reordering, "clear completed", counters, sync, undo. Do not add them.
>
> Before writing anything, show me the classification, the Risk line and the task list, and wait for my go.

L2 2026-11-26 user (verbatim): > 1. as proposed. 2 whole-reject
>
> (approval of the proposed storage key/shape and whole-reject validation; the go for T1.)

L3 2026-11-26 next: T2 (useTasks, test-first).

L4 2026-11-26 agent: T1–T8 implemented test-first; every task marked with its commit hash (25d614d, fde6658, b223d25, eebed5b, dcf1c4f, 994b124). Suite: 8 files / 37 unit tests · 5 e2e (incl. reload persistence and computed completed style) · tsc -b --force · lint · token scanner green on new modules. Deviation note: one CSS line (width: 100%) was caught by the B5 scanner during T3 and replaced with an intrinsic layout property. T9 verification launched next (items 1+3 high tier).

L5 2026-11-26 agent (verifier verdict, range 25d614d..7ade227): READY. C1–C9 all PASS: single write path (saveItem only inside commit), whole-reject verified against 10 hostile seeds (bytes survive mount/unmount, only mutation rewrites), approved key composed and proven end-to-end, all six user strings byte-match L1, no confirm(), B5 clean (align-self replaced the %-incident per L4), localStorage confined to storage.ts, S7 zero additions, no new deps, 7/7 commits Risk-footed, reload/375/120-char browser behaviors confirmed by the verifier's own transient probes (deleted, tree clean). Non-blocking notes carried: (1) latent stale-closure window in useTasks mutations (unreachable via current UI; fixable with a functional-update-form commit if the user wants); (2) e2e pins the literal computed rgb(82, 96, 109) for the muted token — hairpin vs in-page token resolution is the user's call; (3) footer formatting nit: a blank line before Risk would make them git-trailers-parseable (adopted going forward); (4) placeholder.spec.ts naming is stale after S6 (out of scope here). Feature complete pending merge.
