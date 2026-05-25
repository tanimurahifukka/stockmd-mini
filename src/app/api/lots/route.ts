import { NextResponse } from "next/server";
import { createLot, listLots } from "@/modules/lots";
import { parseListQuery } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = parseListQuery(new URL(req.url));
  const r = await listLots(q);
  if (!r.ok) {
    return NextResponse.json(
      { error: "internal_error", message: r.error.kind === "internal" ? r.error.message : "?" },
      { status: 500 },
    );
  }
  return NextResponse.json(r.value);
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "request body must be valid JSON" },
      { status: 400 },
    );
  }
  const r = await createLot(raw);
  if (!r.ok) {
    switch (r.error.kind) {
      case "validation":
        return NextResponse.json(
          { error: "validation_failed", details: r.error.errors },
          { status: 400 },
        );
      case "duplicate_lot_code":
        return NextResponse.json(
          { error: "duplicate_lot_code", message: r.error.message },
          { status: 409 },
        );
      case "missing_stock":
        return NextResponse.json(
          { error: "missing_stock", message: r.error.message },
          { status: 422 },
        );
      default:
        return NextResponse.json(
          { error: "internal_error", message: r.error.message },
          { status: 500 },
        );
    }
  }
  return NextResponse.json({ lot: r.value }, { status: 201 });
}
