// Public surface of the `lots` module. External code must import via this file.

export {
  createLot,
  listLots,
  getLot,
  updateLot,
  deleteLot,
  type ServiceError,
  type ServiceResult,
} from "./service";
export type { Lot, LotCreateInput, LotUpdateInput } from "./types";
