# Human Gates — stockmd-mini

Operations that require explicit human approval before the agent runs them.
The "gate" is a chat acknowledgement or an `agent-progress.md` entry that
names the operation and the task it belongs to.

## Medium-risk gates

- `bash scripts/sandbox/reset.sh --yes` — destroys local DB and volumes.
- Deleting more than 50 rows in any local DB table.
- Refactors that span more than 5 files or 200 lines.
- Adding a new third-party dependency.

## High-risk gates

- Editing any file listed in `.agent/protected-files.json`.
- Disabling a verifier sub-script.
- Adding RLS exceptions on a Supabase table.
- Adding `forbidden` items to `docs/risk-policy.md` (lifting restrictions).

## How to ask for a gate

```
- [ ] gate: <medium|high> — <one-line description>
  Task: <TASK-XXX>
  Why: <reason>
```

Append the request to `QUESTIONS.md` under "Open". The user answers by moving
it to "Closed" with the verdict.

## What "approved" looks like

A line in `agent-progress.md`:

```
- TASK-XXX  gate approved (<medium|high>): <description>
```

Without that line, the gated operation must not run.
