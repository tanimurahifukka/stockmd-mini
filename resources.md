# Resources — stockmd-mini

Every noun the application manages. The verifier
(`scripts/verify/40-crud-coverage.sh`) reads this file and cross-checks
against `feature_list.json`, `task_queue.json`, and (for stack overlays)
the source tree.

When you add a resource, also:

1. Add it to `feature_list.json` under `resources`.
2. Add its CRUD tasks to `task_queue.json`.
3. Create `src/modules/<resource>/` (stack permitting).
4. Add a row below.

## Schema

| Field          | Meaning                                                          |
|----------------|------------------------------------------------------------------|
| name           | resource key, used in paths and config (snake_case)              |
| purpose        | one-line description                                             |
| operations     | comma list of crud ops: create, list, read, update, delete       |
| deletion       | one of: `none`, `soft`, `hard`                                   |
| ownership      | one of: `system`, `user`, `team`                                 |
| pii            | `yes` / `no`                                                     |

## Resources

| name | purpose | operations | deletion | ownership | pii |
|------|---------|------------|----------|-----------|-----|
| `stocks` | A physical inventory item type (the SKU level; quantities at the lot level live in `lots`). | create,list,read,update,delete | soft | system | no |
| `lots` | A per-batch receipt of a `stocks` item (stock_id, lot_code unique per stock, quantity, expiry_at, location, received_at). | create,list,read,update,delete | soft | system | no |
| `suppliers` | A vendor that provides one or more `stocks` (name, contact_email, contact_phone, address, notes). | create,list,read,update,delete | soft | system | no |
| `purchase_orders` | A header-level record of an order placed with a supplier (supplier_id, ordered_at, expected_at, status, total_amount, currency, notes). Line items are out of scope for v1.1. | create,list,read,update,delete | soft | system | no |
| `nfc_tags` | A physical NFC tag with a unique UID, optionally bound to a `lot_id` or `stock_id`. | create,list,read,update,delete | soft | system | no |

