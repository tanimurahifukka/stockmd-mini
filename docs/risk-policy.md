# Risk Policy — stockmd-mini

The harness is built so that a misbehaving agent cannot do real damage. This
policy spells out where the limits are.

## Forbidden by default

The agent must not, under any circumstances inside this repository:

- **production-db** — any operation touching it requires the user to manually edit
  this file and explicitly lift the restriction with a recorded reason.
- **billing** — any operation touching it requires the user to manually edit
  this file and explicitly lift the restriction with a recorded reason.
- **email-sms** — any operation touching it requires the user to manually edit
  this file and explicitly lift the restriction with a recorded reason.
- **deployment** — any operation touching it requires the user to manually edit
  this file and explicitly lift the restriction with a recorded reason.
- **real-user-data** — any operation touching it requires the user to manually edit
  this file and explicitly lift the restriction with a recorded reason.


Beyond the project-specific list above, the harness also forbids:

- Connecting to any production database, API, or message bus.
- Sending real email or SMS, calling payment APIs, or any operation that
  costs money or notifies a real person.
- Pushing to deployment targets, registries, or any remote that affects users.
- Reading or writing credentials outside `.env` (and `.env` is gitignored).

## Risk levels

| Level    | Examples                                                 | Gate          |
|----------|----------------------------------------------------------|---------------|
| Low      | Editing source files inside `src/`, running tests        | Agent freely  |
| Medium   | `scripts/sandbox/reset.sh`, deleting DB rows, large refactors | Human ack in chat or `agent-progress.md` |
| High     | Editing files in `.agent/protected-files.json`           | Explicit human-gated task |
| Critical | Anything that touches the forbidden list above           | Stop immediately, raise a question |

## What "stop immediately" means

- Do not attempt to "work around" the restriction.
- Log a stop event with `--category governance --subcategory production_safety_block`.
- Add a question to `QUESTIONS.md` describing what was being attempted and why.
- Hand back to the user.
