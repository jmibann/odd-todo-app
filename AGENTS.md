# odd-todo-app

A practice app: a to-do list in React + TypeScript, built with **Organic Driven Development (ODD)**.
The project has no code yet: the first request includes the scaffolding.

This file has two parts:

- **Part A — Process policy (ODD):** how much process each request gets, and when.
- **Part B — Code policy:** what the code must look like.

The mechanisms (subagents, test runner, linter, git) carry out both policies.

> The rules in Part A are our own adaptation of the Gentle AI ODD protocol
> (MIT, Copyright (c) 2025 Gentleman Programming). See `THIRD_PARTY_NOTICES.md`.

## Language

- Everything is in English: conversation with the user, code, tests, names, comments, commit messages and feature documents.
- Quote the user's words **verbatim, in the language they were written in**. Never translate or summarize them.

---

# Part A — Process policy (ODD)

## A1. Protocol: every request, in this order

1. **Authorize.** A question, an explanation, a review or a proposal is read-only: write no code. If it is unclear whether the user is asking for a change, ask one question and wait.
2. **Explore.** Before proposing or writing anything, understand the existing code and requirements, in proportion to the request.
3. **Resolve uncertainty.** If a product or design decision is still open, ask. Batch independent questions into one round and wait for the answer. Investigate technical doubts yourself; do not ask the user about them.
4. **Classify.** Decide whether the task is small or large using section A2.
5. **Track before writing.** Only for a large task: create `odd/tasks/<feature>.md` before the first code change, and tell the user in one line which document you created and how many tasks it holds.
6. **Implement task by task.** Apply test-first (A6). Check off a task only with observed evidence.
7. **Close.** Report the verified outcome, every failed, skipped or pending check, the Risk line and the next step. Never invent a result.

## A2. Task size

A task is **small** when all three hold:

1. **Understood:** you know what to change and where, and no product decision is open. You must be able to show this with a single read batch (up to 3 parallel calls, about 10k tokens).
2. **Contained risk:** it touches no item in list A3.
3. **Resumable from the diff:** if the session stopped now, someone could finish the work from the original request and `git diff` alone.

A task is **large** only when condition 3 fails: several sessions, waiting on something external, deliverables the user wants kept apart, or requirements too long to survive in context.

**These never decide size:** the number of files, lines, tests or fixes, or the user asking for a task list.

- **An unclear task is not a large task:** ask or explore, then classify again.
- **A risky task is not a large task:** it gets independent verification (A4), but not necessarily a feature document.

**Small path:** inline. Read, write the RED test, edit (even if the change spans several files), run the focused test and the suite once each, and close. No explorer, no writer, no feature document and no commits unless the user asks for them.

**Large path:** the feature document (A5), work-unit commits on a feature branch, and inline by default, following the document.

## A3. High risk and the Risk line

A change is high risk when a mistake would be hard to detect, hard to undo, or would reach beyond the change. It touches one of these items:

1. **Irreversible data:** changing the format of data already stored (for example, the shape of tasks in `localStorage`), or deleting or changing existing data that cannot be rebuilt.
2. **Security:** authentication, permissions, credentials, secrets.
3. **Contracts others consume:** changing or removing an API, hook or shared helper that other parts already use. Adding something optional does not count.
4. **Concurrency:** race conditions, ordering of async operations.
5. **Environment and delivery:** dependencies, scaffolding, build configuration, CI, deploy.
6. **No safety net:** no test would catch a regression in what changes.

"Unclear" counts as high risk only when one read batch is not enough to tell whether any item applies.

**Risk line:** every code change closes with `Risk: item N (reason)` or `Risk: none`. Before writing `Risk: none`, check whether the diff changes code that some other behavior, not mentioned in the request, also uses. If it does, that is item 3.

## A4. Delegation triggers

No trigger is on by default. **When in doubt, work inline.** But when a trigger holds, delegate: carrying on inline in that case is a defect, even if the result turns out fine.

| Trigger | Condition | Mechanism |
|---|---|---|
| **Ask** | A decision that belongs to the user is still open | One question, then wait |
| **Map** | Understanding the change needs more than one read batch | Built-in `explore` subagent. Ask it for a map of at most ~2k tokens with `file:line` evidence. Spot-check that map once yourself, then classify again |
| **Verification** | The Risk line names an item from A3 | The `verifier` subagent (`.opencode/agents/verifier.md`), after your own checks |
| **Tracking** | The task is large | Feature document (A5) |
| **Writer** | (a) Two or more independent units, with disjoint files, each needing several minutes of work (about 100+ lines), launched together in the same turn; or (b) the session's context is running out | Built-in `general` subagent, one per unit |

Delegation rules:

- **Never delegate because of size, file count or risk.** Risk delegates the verification, not the writing.
- **Units of about 100 lines or fewer always run inline.** Writing them costs less than launching a subagent.
- **Split by behavior, not by kind of work.** A unit includes its code, its tests and its docs. Never one writer for code, another for tests and another for docs.
- **Do not delegate reading files you will read anyway** to write inline.
- **Every writer prompt includes:**
  - the document reference (`Spec: odd/tasks/<feature>.md, T2, S3`);
  - `## Allowed edit surfaces`: the exact paths it may touch;
  - `## Verification`: the exact commands it must run;
  - the helpers it must reuse for shared state, and their invariants, because parallel writers cannot see each other's work.
- **A shared file has one owner**, or the orchestrator edits it at the end.
- **After parallel writers:** check each diff against its allowed paths and run the full suite once (seam check).
- **On large tasks, record each task's route** (inline or delegated) **and the reason in the document.**

## A5. Feature document

Create one only for large tasks, at `odd/tasks/<feature-name>.md`, following the format in `odd/TEMPLATE.md`.

- **Specs:** quote the user's phrases, messages and examples verbatim. Never summarize them and never add requirements the user did not ask for. Mark assumptions as assumptions, and mark agent proposals the user accepted as such.
- **Log:** `L1` is the original request, verbatim. After that, append dated entries: the user's corrections (verbatim), evidence, decisions and the next step. Never delete anything.
- **When a requirement changes:** append the verbatim entry to the Log, rewrite only the affected `S#` and reopen only its task.
- **An agent's finding does not expand the scope:** ask the user.
- **Hand off by reference, never by paraphrase.** A writer reads up to `## Log`. The verifier reads the whole document.

## A6. Test-first

When there is a runner, a deterministic outcome and a clear behavior:

1. Write the test and **watch it fail for the right reason** (RED).
2. Implement the minimum to make it pass (GREEN).
3. Refactor with the tests green.

What to test:

- **One RED test per requested rule**, covering the examples, boundaries and errors that the rule itself names. **Add no other cases.**
- **Assert every observable effect**, through the public interface (what the user sees and does). Never read internal state or `localStorage` directly: test persistence by unmounting and mounting again.
- **Use the user's exact strings**, not paraphrases.
- **For each existing behavior the change touches**, add one test proving it still works as before.
- **When there is no meaningful RED** (docs, purely visual changes, no runner), explain the exception and run a proportionate check. Never invent a RED or a GREEN.

## A7. Verification by tier

| Tier | When | What happens |
|---|---|---|
| Passive | Docs or comments | Read back the structure |
| Medium | Ordinary behavior change | Self-verification: run the commands and report `<command>: <observed result>` |
| High | The Risk line names an item | Self-verification plus the `verifier` subagent |

- **Before delivering**, re-run one of the reported commands.
- **If the verifier finds problems:** one batch of fixes, then one recheck limited to those problems. If they are still open, the task stays `partial` and you explain what is missing. No loops.
- **Add the verifier's probes as regression tests**, unless they ask for something new: in that case, ask the user.
- **Formatters run before verification.** If anything changes after verification, verify again.

## A8. Resuming (no external memory)

The source of truth is the committed feature document plus the git state.

1. Read `odd/tasks/<feature>.md`. Look it up by feature, not by "the last thing that happened".
2. Reconcile it with the code: `git log` (are the commits listed in Tasks there?), `git status` and `git diff` (uncommitted work), and the tests for what is marked done.
3. **If the document and the code disagree, investigate before reopening:** is the commit on another branch (`git branch --all --contains <hash>`)? Did a rebase change the hash (`git log --all --grep`, `git reflog`)? Ask the user only if it is nowhere to be found. Then reopen the task with the reason in the Log.
4. Continue with the first unfinished task, without asking permission to continue work that is already authorized.

## A9. Human control

- **Push, PRs and merges are the user's decision.**
- **Commits:** only on large tasks, one per work unit, on the feature branch (if you are on `main`, create the branch first), with Conventional Commit messages. A unit that names a risk item gets its own commit. On small tasks, only if the user asks.
- **Ask first** before destructive git operations, deleting files or touching another repository.
- **User decisions beat agent momentum.**

---

# Part B — Code policy

> **Initial proposal.** The user may change it. Commands were verified when the scaffolding landed
> (see the TypeScript note in B4).

## B1. Stack

- React 19 + TypeScript (`strict: true`) + Vite.
- pnpm as the package manager.
- Vitest + Testing Library for unit and component tests. Playwright for e2e.
- ESLint with `eslint-plugin-react-hooks`.
- No global state or UI libraries unless a request justifies one. Adding a dependency is item 5 in A3.

## B2. Structure

```text
src/
  features/<feature>/     # components, hooks and tests for one feature
  shared/hooks/           # hooks reused across features
  shared/storage.ts       # the ONLY access point to localStorage
  app/                    # app composition and entry point
e2e/                      # Playwright tests
odd/tasks/                # feature documents
```

## B3. Conventions

- **Components:** function components, one per file, PascalCase names. Type props with `type`, without `React.FC`.
- **Hooks:** `useXxx.ts`, with the test next to it (`useXxx.test.ts`). Do not use `useEffect` to derive state that can be computed during render.
- **Persistence (invariant):** every access to `localStorage` goes through `src/shared/storage.ts`. Never call `localStorage` directly from a component or a hook.
- **Accessibility:** controls have an accessible name (a label or `aria-label`). Tests query by role and label, not by class or `data-testid`, unless there is no alternative.
- **UI text:** strings the user asked for are used verbatim. Strings the agent proposes are marked as proposals in the feature document.
- **No opportunistic refactors:** if you see something worth improving outside the request, mention it when closing; it does not go in the diff.

## B4. Commands

| Purpose | Command |
|---|---|
| Focused test | `pnpm vitest run <file>` |
| Suite | `pnpm test` (`vitest run`; watch: `pnpm test:watch`) |
| E2E | `pnpm exec playwright test` (Chromium; one-time `pnpm exec playwright install chromium`) |
| Lint and types | `pnpm lint` (`eslint .`) · `pnpm exec tsc -b` (not `--noEmit`: the root tsconfig is solution-style, so plain `tsc --noEmit` checks no files) |

- **TypeScript pin:** `typescript` is `~6.0.3`, not 7.x: the current stable typescript-eslint
  (8.74.0) refuses to run on TS 7.0 (typescript-eslint#10940 tracks TS ≥7.1 support).
  Revisit the pin when a stable typescript-eslint supports TS 7.
