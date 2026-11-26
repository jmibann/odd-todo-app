# odd-todo-app

A to-do list in React + TypeScript, built with an AI agent ([OpenCode](https://opencode.ai))
under **Organic Driven Development (ODD)**: the process adapts to what each request actually needs.

## How it is organized

| Layer | Where |
|---|---|
| Process policy (ODD) | `AGENTS.md`, Part A |
| Code policy (stack, structure, conventions) | `AGENTS.md`, Part B |
| Feature documents (large tasks only) | `odd/tasks/`, using the format in `odd/TEMPLATE.md` |
| Independent verifier | `.opencode/agents/verifier.md` |
| Explorer and writers | OpenCode's built-in subagents: `explore` and `general` |

## Getting started

```bash
cd ~/code/odd-todo-app
opencode
```

OpenCode reads `AGENTS.md` automatically.
