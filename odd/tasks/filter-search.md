# Filter with search

Objective: view-only search + status filtering, URL-backed, never touching stored data · Branch: `feat/filter-undo` (writer unit 1) · Runner: `pnpm vitest run src/features/filter` (focused), `pnpm test` (suite)

## Specs

S1. Search — "A search input labeled \"Search tasks\". Matching is a case-insensitive substring match on the trimmed query. An empty query matches everything."

S2. Status — "A status choice labeled \"Show\" with the options \"All\", \"Active\" and \"Completed\". \"All\" is the default."

S3. Combination and empty states — "Search and status combine. When there are tasks but none match, show \"No tasks match.\". When there are no tasks at all, keep showing \"No tasks yet.\"."

S4. URL state — "The filter state lives in the URL: ?q=<query>&status=active|completed. Defaults are omitted from the URL. Changes replace the current history entry instead of adding new ones. A reload or a shared link restores the same view. An unknown status value falls back to \"All\"."

S5. View-only — "Filters only change what is shown, never what is stored or its order."

S6. UI — "Styles follow AGENTS.md B5; works at 375px with no horizontal scroll."

S7. Out of scope (shared) — "Out of scope: undo for other actions, multiple undo levels, sorting, editing, saved filters. Do not add them."

S8. Integration seam (owned by the integrator; undo-delete.md references this) — "Undo restores into the full list whatever filter is active. If the active filter hides the restored task, it stays hidden."

S6 and S7 apply to BOTH features (per L4 dedup); S8 is the req-10 seam, verified at App level.

## Tasks

- [x] T1 (all) orchestrator · this document, L1 verbatim · Risk: none · evidence: commit b9d5b9d
- [x] T2 (S1, S2) writer:general · `TaskFilters.tsx` + css + test (search input, Show select) · Risk: none · evidence: RED import-unresolvable → GREEN (3 tests); commit ea6e4c0
- [x] T3 (S1, S2, S3) writer:general · pure `filterTasks` + `FilterStatus` ("No tasks match.") + tests · Risk: none · evidence: RED → GREEN (7 tests; mutation-check proved the predicate is exercised); commit ea6e4c0
- [x] T4 (S4) writer:general · `useTaskUrlFilter` + test (parse, replaceState, fallback, restore) · Risk: item 4 (history sequencing) · evidence: RED → GREEN (6 tests; pushState spy never called); commit ea6e4c0 · verdict: pending L6
- [x] T5 (S5) writer:general · `TaskFilter` composition (controls + state + visible list) + tests · Risk: none · evidence: RED → GREEN (10 tests; storage-untouched proven via prototype spies); commit ea6e4c0
- [x] T6 (S6) writer:general · e2e `filter-search.spec.ts` · Risk: none · evidence: RED pre-integration (6 failures: "waiting for getByRole('textbox', { name: 'Search tasks' })" on unwired app — recorded during integration) → GREEN 6/6 after commit 7cacaad
- [x] T7 (S8 integration) orchestrator · wired `App.tsx`: `TaskFilter` drop-in, delete handler arms undo, `UndoDelete` mounted; App tests for S5-view-only and S8 seam (restored task hidden under active filter, reappears at original position); also owns S6/S7 for both docs per L4.1 · Risk: item 3 (App composition) · evidence: 3 new App tests RED(2 selector bugs fixed honestly)→GREEN; 19 files/103 unit + 19 e2e green; commit 7cacaad
- [ ] T8 (all) orchestrator · B4 gates (green: 103 unit / 19 e2e / tsc / lint) + verifier (item 4) + close · Risk: verified by `verifier` · evidence: verdict recorded in L6

## Log

L1 2026-11-27 user (verbatim, full two-feature request; the undo parts live in `undo-delete.md`): > Add two independent improvements to the list: filtering with search, and undo for delete.
>
> Filter and search:
> 1. A search input labeled "Search tasks". Matching is a case-insensitive substring match on the trimmed query. An empty query matches everything.
> 2. A status choice labeled "Show" with the options "All", "Active" and "Completed". "All" is the default.
> 3. Search and status combine. When there are tasks but none match, show "No tasks match.". When there are no tasks at all, keep showing "No tasks yet.".
> 4. The filter state lives in the URL: ?q=<query>&status=active|completed. Defaults are omitted from the URL. Changes replace the current history entry instead of adding new ones. A reload or a shared link restores the same view. An unknown status value falls back to "All".
> 5. Filters only change what is shown, never what is stored or its order.
>
> Undo delete:
> 6. Deleting a task shows "Task deleted." with a button "Undo", announced to screen readers, for 5 seconds.
> 7. "Undo" restores the same task (text and completed state) at its original position in the full list, and the message disappears.
> 8. Only the latest deletion can be undone: a new delete replaces the message, and the previous deletion becomes final.
> 9. The deletion is persisted immediately. A reload during the 5 seconds keeps the task deleted and shows no message.
>
> Together:
> 10. Undo restores into the full list whatever filter is active. If the active filter hides the restored task, it stays hidden.
>
> 11. Styles follow AGENTS.md B5; works at 375px with no horizontal scroll.
> 12. Out of scope: undo for other actions, multiple undo levels, sorting, editing, saved filters. Do not add them.
>
> Before writing anything, show me the classification, the Risk line, the task list with the route of each task (inline or writer, with the reason), and, for any writer, the full prompt you would give it. Wait for my go.

L2 2026-11-27 user (verbatim, routing correction): > Your routing misreads A4. "A shared file has one owner, or the orchestrator edits it at the end" is the resolution for shared files, not a disqualifier. App.tsx and the req 10 seam belong to you, after the writers.
>
> The file overlap comes from the design, not the problem:
> - Filter is a pure derivation of the task list: it needs no change to useTasks or TaskList. Its surfaces can be src/features/filter/** only, including where "No tasks match." is rendered.
> - Undo needs src/features/undo/** plus useTasks.ts and its test. It does not need TaskList; it hooks in through onDelete at integration.
>
> Re-plan with those surfaces. Then decide on size, which is the real criterion: estimate the lines (code + tests) of each unit. If both are about 100 or more, route them to writers and show me both prompts. If either is under, keep inline and tell me the numbers.

L3 2026-11-27 orchestrator: size decision — filter ≈ 365 lines, undo ≈ 295 lines (both ≥ 100), surfaces disjoint → two `general` writers launched together (full prompts in this session); App.tsx + integration + req 10 seam owned by the orchestrator. Writer prompts included: spec ref, allowed edit surfaces, verification commands, reused helpers and their invariants.

L4 2026-11-27 user (verbatim): > Two clarifications for when the writers land:
> 1. S6–S7 appear in both feature docs. Each spec must live in exactly one document. Put the seam (req 10) and any shared spec in one doc, owned by you as integrator, and reference it from the other.
> 2. The writers' e2e specs could not run before integration. Before wiring App.tsx, run both e2e specs and record that they fail for the right reason (missing controls); after integration, record that they pass. That is their RED→GREEN.

L5 2026-11-27 orchestrator: dedup per L4.1 executed — this doc now owns the shared specs (S6 UI, S7 out-of-scope) and the seam S8 (req 10); undo-delete.md references them. Writer ran in parallel with the undo writer, disjoint surfaces, both reports verified against git (no out-of-surface edits; App churn observed by the filter writer was transient in the other workspace, git-confirmed reverted). Pre-integration e2e RED: 12 failures across both specs, all "controls missing" reasons, recorded in L4 context and task evidence lines; post-integration GREEN 19/19. Commits: ea6e4c0 (filter unit), f8bfa4f (undo unit), 7cacaad (integration + App seam tests). Two App.test selector bugs self-caught (fireEvent.selectOption stray line; li>span vs li>label). Gates at 7cacaad: pnpm test 19/103, playwright 19/19, tsc -b --force, lint.
