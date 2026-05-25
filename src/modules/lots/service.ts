import type { ListQuery } from "@/lib/query";
import { validateCreate, validateUpdate, type ValidationError } from "./schema";
import {
  insertLot,
  listLots as repoList,
  getLot as repoGet,
  updateLot as repoUpdate,
  softDeleteLot as repoSoftDelete,
  type ListResult,
} from "./repo";
import type { Lot } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_lot_code"; message: string }
  | { kind: "missing_stock"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

export async function createLot(raw: unknown): Promise<ServiceResult<Lot>> {
  const v = validateCreate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await insertLot(v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function listLots(q: ListQuery): Promise<ServiceResult<ListResult>> {
  const r = await repoList(q);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function getLot(id: string): Promise<ServiceResult<Lot>> {
  const r = await repoGet(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function updateLot(id: string, raw: unknown): Promise<ServiceResult<Lot>> {
  const v = validateUpdate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await repoUpdate(id, v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function deleteLot(id: string): Promise<ServiceResult<Lot>> {
  const r = await repoSoftDelete(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

function mapRepoErr(err: {
  kind: "duplicate_lot_code" | "missing_stock" | "not_found" | "db_error";
  message: string;
}): { ok: false; error: ServiceError } {
  switch (err.kind) {
    case "duplicate_lot_code":
      return { ok: false, error: { kind: "duplicate_lot_code", message: err.message } };
    case "missing_stock":
      return { ok: false, error: { kind: "missing_stock", message: err.message } };
    case "not_found":
      return { ok: false, error: { kind: "not_found", message: err.message } };
    default:
      return { ok: false, error: { kind: "internal", message: err.message } };
  }
}
