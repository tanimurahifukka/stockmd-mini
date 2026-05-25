// Public surface of the `stocks` module.
// Per docs/engineering-policy.md and references/module-boundaries.md, other
// modules and `src/app/**` must import from this file only.

export {
  createStock,
  listStocks,
  getStock,
  updateStock,
  deleteStock,
  type ServiceError,
  type ServiceResult,
} from "./service";
export type { Stock, StockCreateInput, StockUpdateInput } from "./types";
