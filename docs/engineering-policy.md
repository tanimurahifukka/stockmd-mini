# Engineering Policy — stockmd-mini

How the agent should write code in this repository. Stack-agnostic rules first,
stack-specific notes at the bottom.

## General

- Prefer editing existing files over creating new ones.
- Keep changes minimal and reversible. A bug fix is a bug fix, not a refactor
  opportunity.
- Default to no comments. Add one only when the *why* is non-obvious.
- No backwards-compatibility shims for code that doesn't ship yet.
- No error handling for cases the type system already excludes.
- Match the project's existing style.

## Boundaries

- Modules under `src/modules/<resource>/` only export through `index.ts`.
- `src/lib/**` is leaf — it cannot import from `src/modules/**`.
- No network calls outside the local sandbox by default.

## Tests

- Tests live next to the code they test: `__tests__/` for unit, `tests/` at the
  root for integration.
- Hitting the database means hitting the local Supabase sandbox — not a mock.

## Git

- One commit per task. The commit subject starts with the task ID:
  `TASK-042: implement stock create`.
- Never commit with `--no-verify`.
- Never amend or force-push to a shared branch.

## Stack notes — nextjs-supabase

- Server components by default; mark client-only files with `"use client"`.
- Route handlers in `src/app/api/<resource>/route.ts`.
- Supabase RLS enabled on every new table; deny-by-default plus explicit policies.
- The service role key never appears in source.

