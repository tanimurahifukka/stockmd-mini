import type { ListQuery } from "@/lib/query";
import { validateCreate, validateUpdate, type ValidationError } from "./schema";
import {
  insertPurchaseOrder,
  listPurchaseOrders as repoList,
  getPurchaseOrder as repoGet,
  updatePurchaseOrder as repoUpdate,
  softDeletePurchaseOrder as repoSoftDelete,
  type ListResult,
} from "./repo";
import type { PurchaseOrder } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_po_number"; message: string }
  | { kind: "missing_supplier"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

function mapRepoErr(err: {
  kind: "duplicate_po_number" | "missing_supplier" | "not_found" | "db_error";
  message: string;
}): { ok: false; error: ServiceError } {
  switch (err.kind) {
    case "duplicate_po_number":
      return { ok: false, error: { kind: "duplicate_po_number", message: err.message } };
    case "missing_supplier":
      return { ok: false, error: { kind: "missing_supplier", message: err.message } };
    case "not_found":
      return { ok: false, error: { kind: "not_found", message: err.message } };
    default:
      return { ok: false, error: { kind: "internal", message: err.message } };
  }
}

export async function createPurchaseOrder(raw: unknown): Promise<ServiceResult<PurchaseOrder>> {
  const v = validateCreate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await insertPurchaseOrder(v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function listPurchaseOrders(q: ListQuery): Promise<ServiceResult<ListResult>> {
  const r = await repoList(q);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function getPurchaseOrder(id: string): Promise<ServiceResult<PurchaseOrder>> {
  const r = await repoGet(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function updatePurchaseOrder(id: string, raw: unknown): Promise<ServiceResult<PurchaseOrder>> {
  const v = validateUpdate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await repoUpdate(id, v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function deletePurchaseOrder(id: string): Promise<ServiceResult<PurchaseOrder>> {
  const r = await repoSoftDelete(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}
