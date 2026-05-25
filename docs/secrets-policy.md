# Secrets Policy — stockmd-mini

## Where secrets live

- `.env` — local-only, gitignored. Never committed.
- Process environment — accepted at runtime.
- Macros and CI secrets — out of scope for the agent; never read or written.

## Where secrets never go

- Any committed file in this repository.
- Any event body under `.agent/events/`.
- Any log line in `.agent/runs/`.
- Any test fixture under `tests/` or `supabase/seed.sql`.
- The agent's own chat replies.

## What the generator writes

- `.env.example` only. Values are placeholders (`changeme`, `local-dev-only`).
- The generator never invents a real secret. If a real value is needed, the
  user must fill it in by hand.

## What the agent must do if it sees a secret

- Stop the current task.
- Log a `governance` stop event with subcategory `secret_detected`.
- Do not echo the secret into chat. Refer to it as `<redacted high-entropy
  string in <file>:<line>>`.
- Hand back to the user. The user removes the secret and rewrites history if
  needed.

## Detection heuristic

A "high-entropy string" is any contiguous run of ≥ 24 characters drawn from
the set `[A-Za-z0-9+/=_-]` that does not match a known low-entropy pattern
(e.g. a hex SHA, a UUID, a base64-encoded short string). The
`scripts/evolution/log_event.py` redactor applies this heuristic to any
message argument it is asked to log.
