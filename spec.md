# Spec — stockmd-mini

## Purpose

Small inventory management app for autonomous coding-agent harness validation.

## Stack

`nextjs-supabase`

## Resources

The application manages the following resources. Each one has its own
folder under `src/modules/<resource>/` (stack permitting) and a row in
`resources.md`.

- `stocks`
- `lots`
- `suppliers`
- `purchase_orders`
- `nfc_tags`


## Out of scope

The following areas are explicitly **out of scope** for this project, and the
agent must not implement them without a recorded human gate:

- production-db
- billing
- email-sms
- deployment
- real-user-data


## Non-functional requirements (placeholder)

- Local-only by default. No outbound network calls beyond package registries
  and the local Supabase API.
- All persistence is reset-safe: `bash scripts/sandbox/reset.sh --yes`
  rebuilds the world.
- Test data must be synthetic.

## Acceptance criteria (skeleton)

- `bash scripts/verify.sh` passes on a freshly reset sandbox.
- Every resource in `resources.md` has CRUD endpoints (per the stack overlay).
- `agent-progress.md` lists each completed task with its commit SHA.

## Decisions (append here as the project evolves)

- _2026-05-25T10:35:55+09:00_ — Project bootstrapped from `agent-harness-bootstrap`
  v1.1 with resources: stocks,lots,suppliers,purchase_orders,nfc_tags.
