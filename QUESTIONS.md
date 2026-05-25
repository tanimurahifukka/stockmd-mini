# QUESTIONS — stockmd-mini

Place to raise ambiguities before guessing. Append; do not delete other
agents' or humans' entries. Use `python3 scripts/evolution/append_question.py`
to add a question linked to the current event.

## Format

```
- [ ] [<task-id>] <one-line question>
  Context: <why this is unclear>
  Blocking: <task this blocks, or "no">
  Linked event: <event_id or "-">
```

## Open

(empty — add questions here)

- [ ] [TASK-003] Confirm or refine the stocks schema chosen for TASK-003 (sku, name, unit, default_location, notes; quantities live in lots). Should there be a category_id, brand, supplier_id, manufacturer_code?
  Context: Spec was silent on stocks fields. Chose a minimal SKU-level schema to unblock TASK-003 (create). Migration: supabase/migrations/20260525000001_create_stocks.sql.
  Blocking: no
  Linked event: TASK-003
- [ ] [TASK-008] Confirm or refine lots schema: stock_id FK, lot_code, quantity numeric, expiry_at date, location, received_at. Should quantity allow negative for adjustments? Should we constrain lot_code uniqueness per stock_id or globally?
  Context: Spec was silent. Chose: lot_code unique per stock_id; quantity numeric(12,2) default 0; expiry_at nullable date; received_at default now().
  Blocking: no
  Linked event: TASK-008
## Closed

(append answered questions here with the resolution date and answer)
