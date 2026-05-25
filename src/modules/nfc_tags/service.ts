import type { ListQuery } from "@/lib/query";
import { validateCreate, validateUpdate, type ValidationError } from "./schema";
import {
  insertNfcTag,
  listNfcTags as repoList,
  getNfcTag as repoGet,
  updateNfcTag as repoUpdate,
  softDeleteNfcTag as repoSoftDelete,
  type ListResult,
} from "./repo";
import type { NfcTag } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_uid"; message: string }
  | { kind: "missing_ref"; message: string }
  | { kind: "constraint_violation"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

function mapRepoErr(err: {
  kind: "duplicate_uid" | "missing_ref" | "constraint_violation" | "not_found" | "db_error";
  message: string;
}): { ok: false; error: ServiceError } {
  switch (err.kind) {
    case "duplicate_uid":
      return { ok: false, error: { kind: "duplicate_uid", message: err.message } };
    case "missing_ref":
      return { ok: false, error: { kind: "missing_ref", message: err.message } };
    case "constraint_violation":
      return { ok: false, error: { kind: "constraint_violation", message: err.message } };
    case "not_found":
      return { ok: false, error: { kind: "not_found", message: err.message } };
    default:
      return { ok: false, error: { kind: "internal", message: err.message } };
  }
}

export async function createNfcTag(raw: unknown): Promise<ServiceResult<NfcTag>> {
  const v = validateCreate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await insertNfcTag(v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function listNfcTags(q: ListQuery): Promise<ServiceResult<ListResult>> {
  const r = await repoList(q);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function getNfcTag(id: string): Promise<ServiceResult<NfcTag>> {
  const r = await repoGet(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function updateNfcTag(id: string, raw: unknown): Promise<ServiceResult<NfcTag>> {
  const v = validateUpdate(raw);
  if (!v.ok) return { ok: false, error: { kind: "validation", errors: v.errors } };
  const r = await repoUpdate(id, v.value);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}

export async function deleteNfcTag(id: string): Promise<ServiceResult<NfcTag>> {
  const r = await repoSoftDelete(id);
  if (!r.ok) return mapRepoErr(r.error);
  return { ok: true, value: r.value };
}
