import type { StockCreateInput, StockUpdateInput } from "./types";

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const SKU_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;

export function validateCreate(raw: unknown): ValidationResult<StockCreateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const sku = typeof r.sku === "string" ? r.sku.trim() : "";
  if (!sku) errors.push({ field: "sku", message: "required" });
  else if (!SKU_RE.test(sku)) {
    errors.push({
      field: "sku",
      message: "must be 2-64 chars, start with alnum, contain only [A-Za-z0-9._-]",
    });
  }

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) errors.push({ field: "name", message: "required" });
  else if (name.length > 200) errors.push({ field: "name", message: "must be ≤ 200 chars" });

  const unit = r.unit === undefined || r.unit === null
    ? "piece"
    : typeof r.unit === "string" ? r.unit.trim() : null;
  if (unit === null || unit === "") {
    errors.push({ field: "unit", message: "must be a non-empty string when provided" });
  }

  const default_location = parseNullableString(r.default_location, "default_location", errors);
  const notes = parseNullableString(r.notes, "notes", errors);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sku,
      name,
      unit: unit ?? "piece",
      default_location,
      notes,
    },
  };
}

export function validateUpdate(raw: unknown): ValidationResult<StockUpdateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const out: StockUpdateInput = {};

  if (r.name !== undefined) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) errors.push({ field: "name", message: "must be non-empty when provided" });
    else if (name.length > 200) errors.push({ field: "name", message: "must be ≤ 200 chars" });
    else out.name = name;
  }
  if (r.unit !== undefined) {
    const unit = typeof r.unit === "string" ? r.unit.trim() : "";
    if (!unit) errors.push({ field: "unit", message: "must be non-empty when provided" });
    else out.unit = unit;
  }
  if (r.default_location !== undefined) {
    out.default_location = parseNullableString(r.default_location, "default_location", errors);
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

export function expectObject(
  raw: unknown,
  errors: ValidationError[],
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push({ field: "_root", message: "body must be a JSON object" });
    return null;
  }
  return raw as Record<string, unknown>;
}

export function parseNullableString(
  v: unknown,
  field: string,
  errors: ValidationError[],
): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") {
    errors.push({ field, message: "must be a string or null" });
    return null;
  }
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}
