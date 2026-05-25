import { validateCreate, type ValidationError } from "./schema";
import { insertStock } from "./repo";
import type { Stock } from "./types";

export type ServiceError =
  | { kind: "validation"; errors: ValidationError[] }
  | { kind: "duplicate_sku"; message: string }
  | { kind: "internal"; message: string };

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ServiceError };

export async function createStock(raw: unknown): Promise<ServiceResult<Stock>> {
  const v = validateCreate(raw);
  if (!v.ok) {
    return { ok: false, error: { kind: "validation", errors: v.errors } };
  }
  const r = await insertStock(v.value);
  if (!r.ok) {
    if (r.error.kind === "duplicate_sku") {
      return { ok: false, error: { kind: "duplicate_sku", message: r.error.message } };
    }
    return { ok: false, error: { kind: "internal", message: r.error.message } };
  }
  return { ok: true, value: r.value };
}
