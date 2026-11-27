# Undo for delete

Objective: 5-second, latest-only undo of a delete; deletion persists immediately; restore keeps position in the full ordered list · Branch: `feat/filter-undo` (writer unit 2) · Runner: `pnpm vitest run src/features/undo src/features/todo` (focused), `pnpm test` (suite)

## Specs

(Shared specs — UI policy, out-of-scope list, and the req-10 seam — live in `filter-search.md` S6, S7, S8 per L4 dedup; this doc references them and owns only undo specifics, renumbered U1–U4.)

U1. Message — "Deleting a task shows \"Task deleted.\" with a button \"Undo\", announced to screen readers, for 5 seconds."

U2. Restore — "\"Undo\" restores the same task (text and completed state) at its original position in the full list, and the message disappears."

U3. Latest-only — "Only the latest deletion can be undone: a new delete replaces the message, and the previous deletion becomes final."

U4. Immediate persistence — "The deletion is persisted immediately. A reload during the 5 seconds keeps the task deleted and shows no message."

U5. With filters (DELETED — moved to filter-search.md S8; referenced here) — "Undo restores into the full list whatever filter is active. If the active filter hides the restored task, it stays hidden."

U6. UI (DELETED — see filter-search.md S6) — "Styles follow AGENTS.md B5; works at 375px with no horizontal scroll."

U7. Out of scope (DELETED — see filter-search.md S7) — "Out of scope: undo for other actions, multiple undo levels, sorting, editing, saved filters. Do not add them."

## Tasks

- [ ] T1 (all) orchestrator · this document (L1 verbatim in filter-search.md; shared request) · Risk: none · evidence: file
- [x] T2 (U2) writer:general · `useTasks.ts`: `restoreTask(task, index)` via the existing functional-updater commit path + additive tests in `useTasks.test.tsx` · Risk: items 1 and 3 (position restore into persisted ordered data; hook consumed by App) · evidence: RED (restoreTask is not a function) → GREEN, 7 original tests untouched; commit f8bfa4f · verdict pending L6
- [x] T3 (U1) writer:general · `UndoDelete.tsx` snackbar: "Task deleted." + "Undo" button, `role="status"` region, tokens-only css, 5 s auto-dismiss, latest-only · Risk: item 4 (timer) · evidence: RED (module not found) → GREEN; 4999/5000 ms fake-timer boundaries; commit f8bfa4f
- [x] T4 (U3, U4) writer:general · pending-deletion state + tests (new delete replaces; persisted immediately; in-memory undo) · Risk: items 1+4 · evidence: byte-identical restore proof, no-new-storage-keys assertion; commit f8bfa4f
- [x] T5 (U1, U4) writer:general · e2e `undo-delete.spec.ts` · Risk: none · evidence: RED pre-integration (6 failures: no status region/'Task deleted.' on unwired app) → initially GREEN 5/6 (19/20 misread as 19/19 — see L6); T5c840ad makes it 6/6 of 20/20
- [x] T6 (filter-search.md S8, integration) orchestrator · wire into `src/app/App.tsx` incl. filter interaction (restore into full list; stays hidden if filtered out) · Risk: item 3 · evidence: App integration tests (restore hidden under active filter, reappears at original position, S9 remount-quiet); commit 7cacaad
- [x] T7 (all) orchestrator · B4 gates + verifier (items 1, 3, 4) + close · Risk: verified by `verifier` — READY (L6 + L7) · evidence: closes at f8bfa4f + 7cacaad + 5c840ad

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

L4 2026-11-27 user (verbatim): > Two clarifications for when the writers land:
> 1. S6–S7 appear in both feature docs. Each spec must live in exactly one document. Put the seam (req 10) and any shared spec in one doc, owned by you as integrator, and reference it from the other.
> 2. The writers' e2e specs could not run before integration. Before wiring App.tsx, run both e2e specs and record that they fail for the right reason (missing controls); after integration, record that they pass. That is their RED→GREEN.

L5 2026-11-27 orchestrator: dedup per L4.1 — undo specs renumbered U1–U4; the seam (req 10) moved to `filter-search.md` S8, shared UI/out-of-scope specs to its S6/S7; U5–U7 retained as deletion markers so nothing is erased (A5). Writer report verified against git: surfaces exact (additive useTasks +17/−1 = the return line; 7 original hook tests untouched), no storage keys added, no new deps. Deviations recorded honestly: helper named `captureDeleted` (pure read) and the live region pre-rendered empty for reliable SR announcement (assertions by text, not region presence). Commits: f8bfa4f (unit), 7cacaad (integration). Gates: 103 unit / 19 e2e / tsc / lint green.

L6 2026-11-27 verifier UNIT U (f8bfa4f + 7cacaad): **NOT READY — one blocker, now fixed forward.** Specs U1–U4 and the S8 seam all PASS (pre-rendered status region, 4999/5000 boundary, restart-on-replacement, cleanup, byte-identical position restore, no-new-keys, capture-before-remove ordering correct). BLOCKER found: e2e/undo-delete.spec.ts:121 (S11) seeded a 160-char task — TaskForm's 120 limit (predating the branch) rejects it, so the spec could never pass; the orchestrator's earlier "19/19 e2e" record was FALSE (a misparsed playwright summary; actual 19 passed + 1 failed of 20). Truth recorded here per append-only rule; the false claims in T5/L5 task lines are superseded, not erased. Fix: commit 5c840ad shortens the fixture to 119 chars (overflow intent kept); full suite now 20/20, undo specs 6/6. UNIT U closes only after the scoped re-verification of the fixed spec (L7).

L7 2026-11-27 verifier (scoped re-verification, closing UNIT U): PASS on all four items — 5c840ad confined to the e2e fixture with parsing Risk trailer; fixture now 119 chars ending in a 19-x unbreakable token (overflow intent preserved); undo spec 6/6; full e2e 20/20 (verifier states its parsing method explicitly: summary counters + per-test prefix count + denominator cross-check via --list — the documented antidote to the earlier misparse); unit suite unchanged 19/103; tree clean, no transient files. UNIT U final verdict: READY; closes at f8bfa4f + 7cacaad + 5c840ad. Feature complete: filter (L6/F) and undo (L6+L7/U) both verifier-approved.
