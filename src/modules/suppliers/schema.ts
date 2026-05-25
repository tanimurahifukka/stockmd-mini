import type { SupplierCreateInput, SupplierUpdateInput } from "./types";

export type ValidationError = { field: string; message: string };
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function validateCreate(raw: unknown): ValidationResult<SupplierCreateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) errors.push({ field: "name", message: "required" });
  else if (name.length > 200) errors.push({ field: "name", message: "must be ≤ 200 chars" });

  const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
  if (!slug) errors.push({ field: "slug", message: "required" });
  else if (!SLUG_RE.test(slug)) {
    errors.push({ field: "slug", message: "must be 1-64 chars, lowercase alnum and hyphens, no leading/trailing hyphen" });
  }

  const contact_email = parseNullableString(r.contact_email, "contact_email", errors);
  if (contact_email && !EMAIL_RE.test(contact_email)) {
    errors.push({ field: "contact_email", message: "must look like an email" });
  }
  const contact_phone = parseNullableString(r.contact_phone, "contact_phone", errors);
  const address = parseNullableString(r.address, "address", errors);
  const notes = parseNullableString(r.notes, "notes", errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { name, slug, contact_email, contact_phone, address, notes } };
}

export function validateUpdate(raw: unknown): ValidationResult<SupplierUpdateInput> {
  const errors: ValidationError[] = [];
  const r = expectObject(raw, errors);
  if (!r) return { ok: false, errors };

  const out: SupplierUpdateInput = {};

  if (r.name !== undefined) {
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) errors.push({ field: "name", message: "must be non-empty when provided" });
    else if (name.length > 200) errors.push({ field: "name", message: "must be ≤ 200 chars" });
    else out.name = name;
  }
  if (r.slug !== undefined) {
    const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
    if (!slug || !SLUG_RE.test(slug)) {
      errors.push({ field: "slug", message: "invalid slug" });
    } else out.slug = slug;
  }
  if (r.contact_email !== undefined) {
    const v = parseNullableString(r.contact_email, "contact_email", errors);
    if (v && !EMAIL_RE.test(v)) {
      errors.push({ field: "contact_email", message: "must look like an email" });
    } else out.contact_email = v;
  }
  if (r.contact_phone !== undefined) {
    out.contact_phone = parseNullableString(r.contact_phone, "contact_phone", errors);
  }
  if (r.address !== undefined) {
    out.address = parseNullableString(r.address, "address", errors);
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
