import { NextResponse } from "next/server";
import { getSupplier, updateSupplier, deleteSupplier } from "@/modules/suppliers";
import { isUuid } from "@/lib/query";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function badId(id: string) {
  return NextResponse.json(
    { error: "invalid_id", message: `'${id}' is not a uuid` },
    { status: 400 },
  );
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!isUuid(params.id)) return badId(params.id);
  const r = await getSupplier(params.id);
  if (!r.ok) return mapError(r.error);
  return NextResponse.json({ supplier: r.value });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isUuid(params.id)) return badId(params.id);
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "request body must be valid JSON" },
      { status: 400 },
    );
  }
  const r = await updateSupplier(params.id, raw);
  if (!r.ok) return mapError(r.error);
  return NextResponse.json({ supplier: r.value });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!isUuid(params.id)) return badId(params.id);
  const r = await deleteSupplier(params.id);
  if (!r.ok) return mapError(r.error);
  return NextResponse.json({ supplier: r.value });
}

function mapError(err: { kind: string; message?: string; errors?: unknown }) {
  switch (err.kind) {
    case "validation":
      return NextResponse.json({ error: "validation_failed", details: err.errors }, { status: 400 });
    case "not_found":
      return NextResponse.json({ error: "not_found", message: err.message }, { status: 404 });
    case "duplicate_slug":
      return NextResponse.json({ error: "duplicate_slug", message: err.message }, { status: 409 });
    default:
      return NextResponse.json({ error: "internal_error", message: err.message }, { status: 500 });
  }
}
