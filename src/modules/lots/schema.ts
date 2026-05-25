import { isUuid } from "@/lib/query";
import type { LotCreateInput, LotUpdateInput } from "./types";

export type ValidationError = { field: string; message: string };
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const LOT_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

export function validateCreate(raw: unknown): ValidationResult<LotCreateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const stock_id = typeof r.stock_id === "string" ? r.stock_id.trim() : "";
  if (!stock_id) errors.push({ field: "stock_id", message: "required" });
  else if (!isUuid(stock_id)) errors.push({ field: "stock_id", message: "must be a uuid" });

  const lot_code = typeof r.lot_code === "string" ? r.lot_code.trim() : "";
  if (!lot_code) errors.push({ field: "lot_code", message: "required" });
  else if (!LOT_CODE_RE.test(lot_code)) {
    errors.push({
      field: "lot_code",
      message: "must be 1-64 chars, start with alnum, contain only [A-Za-z0-9._/-]",
    });
  }

  const quantity = parseQuantity(r.quantity, "quantity", errors);
  const expiry_at = parseNullableDate(r.expiry_at, "expiry_at", errors);
  const received_at = parseNullableTimestamp(r.received_at, "received_at", errors);
  const location = parseNullableString(r.location, "location", errors);
  const notes = parseNullableString(r.notes, "notes", errors);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { stock_id, lot_code, quantity, expiry_at, received_at, location, notes },
  };
}

export function validateUpdate(raw: unknown): ValidationResult<LotUpdateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const out: LotUpdateInput = {};

  if (r.lot_code !== undefined) {
    const code = typeof r.lot_code === "string" ? r.lot_code.trim() : "";
    if (!code) errors.push({ field: "lot_code", message: "must be non-empty when provided" });
    else if (!LOT_CODE_RE.test(code)) {
      errors.push({ field: "lot_code", message: "invalid format" });
    } else out.lot_code = code;
  }
  if (r.quantity !== undefined) {
    const q = parseQuantity(r.quantity, "quantity", errors);
    if (q !== undefined) out.quantity = q;
  }
  if (r.expiry_at !== undefined) {
    out.expiry_at = parseNullableDate(r.expiry_at, "expiry_at", errors);
  }
  if (r.received_at !== undefined) {
    out.received_at = parseNullableTimestamp(r.received_at, "received_at", errors);
  }
  if (r.location !== undefined) {
    out.location = parseNullableString(r.location, "location", errors);
  }
  if (r.notes !== undefined) {
    out.notes = parseNullableString(r.notes, "notes", errors);
  }
  if (errors.length === 0 && Object.keys(out).length === 0) {
    errors.push({ field: "_root", message: "at least one field must be provided" });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: out };
}

function expectObject(raw: unknown, errors: ValidationError[]): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push({ field: "_root", message: "body must be a JSON object" });
    return null;
  }
  return raw as Record<string, unknown>;
}

function parseQuantity(v: unknown, field: string, errors: ValidationError[]): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) {
    errors.push({ field, message: "must be a finite number" });
    return 0;
  }
  if (n < 0) {
    errors.push({ field, message: "must be ≥ 0" });
    return 0;
  }
  return n;
}

function parseNullableString(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") {
    errors.push({ field, message: "must be a string or null" });
    return null;
  }
  const t = v.trim();
  return t === "" ? null : t;
}

function parseNullableDate(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || !DATE_RE.test(v)) {
    errors.push({ field, message: "must be YYYY-MM-DD or null" });
    return null;
  }
  return v;
}

function parseNullableTimestamp(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || !TS_RE.test(v)) {
    errors.push({ field, message: "must be ISO 8601 timestamp or null" });
    return null;
  }
  return v;
}
