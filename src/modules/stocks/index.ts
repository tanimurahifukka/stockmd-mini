// Public surface of the `stocks` module.
// Per docs/engineering-policy.md and references/module-boundaries.md, other
// modules and `src/app/**` must import from this file only.

export { createStock, type ServiceError, type ServiceResult } from "./service";
export type { Stock, StockCreateInput } from "./types";
