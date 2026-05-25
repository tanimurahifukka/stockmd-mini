import type { ListQuery } from "@/lib/query";
import { validateCreate, validateUpdate, type ValidationError } from "./schema";
import {
  insertSupplier,
  listSuppliers as repoList,
  getSupplier as repoGet,
  updateSupplier as repoUpdate,
  softDeleteSupplier as repoSoftDelete,
  type ListResult,
} from "./repo";
import type { Supplier } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_slug"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

function mapRepoErr(err: { kind: "duplicate_slug" | "not_found" | "db_error"; message: string }): {
  ok: false; error: ServiceError;
} {
  switch (err.kind) {
    case "duplicate_slug":
      return { ok: false, error: { kind: "duplicate_slug", message: err.message } };
    case "not_found":
      return { ok: false, error: { kind: "not_found", message: err.message } };
    default:
      return { ok: false, error: { kind: "internal", message: err.message } };
  }
}

export async function createSupplier(raw: unknown): Promise<ServiceResult<Supplier>> {
  const v = validateCreate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await insertSupplier(v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function listSuppliers(q: ListQuery): Promise<ServiceResult<ListResult>> {
  const r = await repoList(q);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function getSupplier(id: string): Promise<ServiceResult<Supplier>> {
  const r = await repoGet(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function updateSupplier(id: string, raw: unknown): Promise<ServiceResult<Supplier>> {
  const v = validateUpdate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await repoUpdate(id, v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function deleteSupplier(id: string): Promise<ServiceResult<Supplier>> {
  const r = await repoSoftDelete(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}
