import type { StockCreateInput } from "./types";

export type ValidationError = {
  field: string;
  message: string;
};

const SKU_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;

export function validateCreate(raw: unknown): {
  ok: true;
  value: StockCreateInput;
} | {
  ok: false;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: [{ field: "_root", message: "body must be a JSON object" }] };
  }

  const r = raw as Record<string, unknown>;

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
  else if (name.length > 200) {
    errors.push({ field: "name", message: "must be ≤ 200 chars" });
  }

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

function parseNullableString(
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
