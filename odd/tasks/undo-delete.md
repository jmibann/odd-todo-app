# Undo for delete

Objective: 5-second, latest-only undo of a delete; deletion persists immediately; restore keeps position in the full ordered list · Branch: `feat/filter-undo` (writer unit 2) · Runner: `pnpm vitest run src/features/undo src/features/todo` (focused), `pnpm test` (suite)

## Specs

S6. Message — "Deleting a task shows \"Task deleted.\" with a button \"Undo\", announced to screen readers, for 5 seconds."

S7. Restore — "\"Undo\" restores the same task (text and completed state) at its original position in the full list, and the message disappears."

S8. Latest-only — "Only the latest deletion can be undone: a new delete replaces the message, and the previous deletion becomes final."

S9. Immediate persistence — "The deletion is persisted immediately. A reload during the 5 seconds keeps the task deleted and shows no message."

S10. With filters — "Undo restores into the full list whatever filter is active. If the active filter hides the restored task, it stays hidden."

S11. UI — "Styles follow AGENTS.md B5; works at 375px with no horizontal scroll."

S12. Out of scope — "Out of scope: undo for other actions, multiple undo levels, sorting, editing, saved filters. Do not add them."

## Tasks

- [ ] T1 (all) orchestrator · this document (L1 verbatim in filter-search.md; shared request) · Risk: none · evidence: file
- [ ] T2 (S7) writer:general · `useTasks.ts`: `restoreTask(task, index)` via the existing functional-updater commit path + additive tests in `useTasks.test.tsx` · Risk: items 1 and 3 (position restore into persisted ordered data; hook consumed by App) · evidence: RED→GREEN, existing tests untouched
- [ ] T3 (S6) writer:general · `UndoDelete.tsx` snackbar: "Task deleted." + "Undo" button, `role="status"` region, tokens-only css, 5 s auto-dismiss, latest-only · Risk: item 4 (timer) · evidence: RED→GREEN with fake timers
- [ ] T4 (S8, S9) writer:general · pending-deletion state + tests (new delete replaces; persisted immediately; in-memory undo) · Risk: items 1+4 · evidence: RED→GREEN
- [ ] T5 (S6, S9, S12) writer:general · e2e `undo-delete.spec.ts` · Risk: none · evidence: playwright (after integration)
- [ ] T6 (S10, integration) orchestrator · wire into `src/app/App.tsx` incl. filter interaction (restore into full list; stays hidden if filtered out) · Risk: item 3 · evidence: App-level tests + gates
- [ ] T7 (all) orchestrator · B4 gates + verifier (items 1, 3, 4) + close · Risk: verified by `verifier` · evidence: outputs + verdict

## Log

L1 2026-11-27 user: full verbatim two-feature request — recorded in `filter-search.md` L1 (requirements 6–10 and 11–12 apply to this feature).

L2 2026-11-27 user (verbatim, routing correction): > Your routing misreads A4. "A shared file has one owner, or the orchestrator edits it at the end" is the resolution for shared files, not a disqualifier. App.tsx and the req 10 seam belong to you, after the writers.
>
> The file overlap comes from the design, not the problem:
> - Filter is a pure derivation of the task list: it needs no change to useTasks or TaskList. Its surfaces can be src/features/filter/** only, including where "No tasks match." is rendered.
> - Undo needs src/features/undo/** plus useTasks.ts and its test. It does not need TaskList; it hooks in through onDelete at integration.
>
> Re-plan with those surfaces. Then decide on size, which is the real criterion: estimate the lines (code + tests) of each unit. If both are about 100 or more, route them to writers and show me both prompts. If either is under, keep inline and tell me the numbers.

L3 2026-11-27 orchestrator: routed to a `general` writer (≈295 lines, disjoint from the filter writer's surfaces); prompts and invariants per filter-search.md L3.
