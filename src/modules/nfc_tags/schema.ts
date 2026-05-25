import { isUuid } from "@/lib/query";
import type { NfcTagCreateInput, NfcTagUpdateInput } from "./types";

export type ValidationError = { field: string; message: string };
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

// NFC tag UIDs are typically uppercase hex with optional separators; accept
// 8-32 hex chars after stripping :-.
const UID_RAW_RE = /^[A-Fa-f0-9]{8,32}$/;
const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

function normalizeUid(raw: string): string {
  return raw.replace(/[:\-\s]/g, "").toUpperCase();
}

function expectObject(raw: unknown, errors: ValidationError[]): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push({ field: "_root", message: "body must be a JSON object" });
    return null;
  }
  return raw as Record<string, unknown>;
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

function parseNullableUuid(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") {
    errors.push({ field, message: "must be a uuid or null" });
    return null;
  }
  const t = v.trim();
  if (!t) return null;
  if (!isUuid(t)) {
    errors.push({ field, message: "must be a uuid or null" });
    return null;
  }
  return t;
}

function parseNullableTimestamp(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || !TS_RE.test(v)) {
    errors.push({ field, message: "must be ISO 8601 timestamp or null" });
    return null;
  }
  return v;
}

export function validateCreate(raw: unknown): ValidationResult<NfcTagCreateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const uidRaw = typeof r.uid === "string" ? r.uid.trim() : "";
  let uid = "";
  if (!uidRaw) {
    errors.push({ field: "uid", message: "required" });
  } else {
    uid = normalizeUid(uidRaw);
    if (!UID_RAW_RE.test(uid)) {
      errors.push({ field: "uid", message: "must be 8-32 hex chars (separators :,-, whitespace ok)" });
    }
  }

  const label = parseNullableString(r.label, "label", errors);
  const lot_id = parseNullableUuid(r.lot_id, "lot_id", errors);
  const stock_id = parseNullableUuid(r.stock_id, "stock_id", errors);
  if (lot_id && stock_id) {
    errors.push({ field: "_root", message: "may not bind to both lot_id and stock_id" });
  }
  const bound_at = parseNullableTimestamp(r.bound_at, "bound_at", errors);
  const notes = parseNullableString(r.notes, "notes", errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { uid, label, lot_id, stock_id, bound_at, notes } };
}

export function validateUpdate(raw: unknown): ValidationResult<NfcTagUpdateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const out: NfcTagUpdateInput = {};
  if (r.label !== undefined) out.label = parseNullableString(r.label, "label", errors);
  if (r.lot_id !== undefined) out.lot_id = parseNullableUuid(r.lot_id, "lot_id", errors);
  if (r.stock_id !== undefined) out.stock_id = parseNullableUuid(r.stock_id, "stock_id", errors);
  if (out.lot_id && out.stock_id) {
    errors.push({ field: "_root", message: "may not bind to both lot_id and stock_id" });
  }
  if (r.bound_at !== undefined) out.bound_at = parseNullableTimestamp(r.bound_at, "bound_at", errors);
  if (r.notes !== undefined) out.notes = parseNullableString(r.notes, "notes", errors);
  if (errors.length === 0 && Object.keys(out).length === 0) {
    errors.push({ field: "_root", message: "at least one field must be provided" });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: out };
}
