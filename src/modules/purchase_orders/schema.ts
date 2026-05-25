import { isUuid } from "@/lib/query";
import type {
  PurchaseOrderCreateInput,
  PurchaseOrderStatus,
  PurchaseOrderUpdateInput,
} from "./types";

export type ValidationError = { field: string; message: string };
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const PO_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
const STATUSES: readonly PurchaseOrderStatus[] = ["draft", "submitted", "received", "cancelled"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

function expectObject(raw: unknown, errors: ValidationError[]): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push({ field: "_root", message: "body must be a JSON object" });
    return null;
  }
  return raw as Record<string, unknown>;
}

function parseAmount(v: unknown, field: string, errors: ValidationError[]): number {
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

function parseStatus(v: unknown, field: string, errors: ValidationError[]): PurchaseOrderStatus | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || !STATUSES.includes(v as PurchaseOrderStatus)) {
    errors.push({ field, message: `must be one of: ${STATUSES.join(", ")}` });
    return undefined;
  }
  return v as PurchaseOrderStatus;
}

function parseCurrency(v: unknown, field: string, errors: ValidationError[]): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") {
    errors.push({ field, message: "must be a 3-letter ISO 4217 code" });
    return undefined;
  }
  const c = v.trim().toUpperCase();
  if (!CURRENCY_RE.test(c)) {
    errors.push({ field, message: "must be a 3-letter ISO 4217 code" });
    return undefined;
  }
  return c;
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

function parseNullableString(v: unknown, field: string, errors: ValidationError[]): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") {
    errors.push({ field, message: "must be a string or null" });
    return null;
  }
  const t = v.trim();
  return t === "" ? null : t;
}

export function validateCreate(raw: unknown): ValidationResult<PurchaseOrderCreateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const po_number = typeof r.po_number === "string" ? r.po_number.trim() : "";
  if (!po_number) errors.push({ field: "po_number", message: "required" });
  else if (!PO_RE.test(po_number)) errors.push({ field: "po_number", message: "invalid format" });

  const supplier_id = typeof r.supplier_id === "string" ? r.supplier_id.trim() : "";
  if (!supplier_id) errors.push({ field: "supplier_id", message: "required" });
  else if (!isUuid(supplier_id)) errors.push({ field: "supplier_id", message: "must be a uuid" });

  const status = parseStatus(r.status, "status", errors) ?? "draft";
  const total_amount = parseAmount(r.total_amount, "total_amount", errors);
  const currency = parseCurrency(r.currency, "currency", errors) ?? "JPY";
  const ordered_at = parseNullableTimestamp(r.ordered_at, "ordered_at", errors);
  const expected_at = parseNullableDate(r.expected_at, "expected_at", errors);
  const notes = parseNullableString(r.notes, "notes", errors);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { po_number, supplier_id, status, total_amount, currency, ordered_at, expected_at, notes },
  };
}

export function validateUpdate(raw: unknown): ValidationResult<PurchaseOrderUpdateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const out: PurchaseOrderUpdateInput = {};
  if (r.po_number !== undefined) {
    const po = typeof r.po_number === "string" ? r.po_number.trim() : "";
    if (!po || !PO_RE.test(po)) errors.push({ field: "po_number", message: "invalid format" });
    else out.po_number = po;
  }
  if (r.status !== undefined) {
    const s = parseStatus(r.status, "status", errors);
    if (s) out.status = s;
  }
  if (r.total_amount !== undefined) {
    out.total_amount = parseAmount(r.total_amount, "total_amount", errors);
  }
  if (r.currency !== undefined) {
    const c = parseCurrency(r.currency, "currency", errors);
    if (c) out.currency = c;
  }
  if (r.ordered_at !== undefined) {
    out.ordered_at = parseNullableTimestamp(r.ordered_at, "ordered_at", errors);
  }
  if (r.expected_at !== undefined) {
    out.expected_at = parseNullableDate(r.expected_at, "expected_at", errors);
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
