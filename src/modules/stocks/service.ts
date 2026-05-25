import type { ListQuery } from "@/lib/query";
import { validateCreate, validateUpdate, type ValidationError } from "./schema";
import {
  insertStock,
  listStocks as repoList,
  getStock as repoGet,
  updateStock as repoUpdate,
  softDeleteStock as repoSoftDelete,
  type ListResult,
} from "./repo";
import type { Stock } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_sku"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ServiceError };

export async function createStock(raw: unknown): Promise<ServiceResult<Stock>> {
  const v = validateCreate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await insertStock(v.value);
  if (!r.ok) {
    if (r.error.kind === "duplicate_sku") {
      return { ok: false, error: { kind: "duplicate_sku", message: r.error.message } };
    }
    return { ok: false, error: { kind: "internal", message: r.error.message } };
  }
  return { ok: true, value: r.value };
}

export async function listStocks(q: ListQuery): Promise<ServiceResult<ListResult>> {
  const r = await repoList(q);
  if (!r.ok) return { ok: false, error: { kind: "internal", message: r.error.message } };
  return { ok: true, value: r.value };
}

export async function getStock(id: string): Promise<ServiceResult<Stock>> {
  const r = await repoGet(id);
  if (!r.ok) {
    if (r.error.kind === "not_found") {
      return { ok: false, error: { kind: "not_found", message: r.error.message } };
    }
    return { ok: false, error: { kind: "internal", message: r.error.message } };
  }
  return { ok: true, value: r.value };
}

export async function updateStock(id: string, raw: unknown): Promise<ServiceResult<Stock>> {
  const v = validateUpdate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await repoUpdate(id, v.value);
  if (!r.ok) {
    if (r.error.kind === "not_found") {
      return { ok: false, error: { kind: "not_found", message: r.error.message } };
    }
    return { ok: false, error: { kind: "internal", message: r.error.message } };
  }
  return { ok: true, value: r.value };
}

export async function deleteStock(id: string): Promise<ServiceResult<Stock>> {
  const r = await repoSoftDelete(id);
  if (!r.ok) {
    if (r.error.kind === "not_found") {
      return { ok: false, error: { kind: "not_found", message: r.error.message } };
    }
    return { ok: false, error: { kind: "internal", message: r.error.message } };
  }
  return { ok: true, value: r.value };
}
