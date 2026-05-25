# Project Selection — stockmd-mini

Phase -1 record: why this project was chosen as the target for an autonomous
agent, and what the boundaries are.

## Why this project

Small inventory management app for autonomous coding-agent harness validation.

## Why this project is safe to fail at

- The agent operates entirely in a local sandbox; no remote impact.
- All persisted data is synthetic and reset-safe.
- Forbidden areas (see `docs/risk-policy.md`) include the categories that
  would otherwise create real-world consequences.

## Scope

- Resources: stocks,lots,suppliers,purchase_orders,nfc_tags
- Stack: `nextjs-supabase`

## Out of scope (recap)

- production-db
- billing
- email-sms
- deployment
- real-user-data


## Success looks like

- A green `bash scripts/verify.sh` on a freshly reset sandbox.
- Each resource has CRUD endpoints implemented end to end.
- The agent's stop log shows decreasing frequency of `agent_behavior` and
  `specification` categories over time.
