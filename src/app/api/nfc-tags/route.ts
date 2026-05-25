import { NextResponse } from "next/server";
import { createNfcTag, listNfcTags } from "@/modules/nfc_tags";
import { parseListQuery } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = parseListQuery(new URL(req.url));
  const r = await listNfcTags(q);
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
  const r = await createNfcTag(raw);
  if (!r.ok) {
    switch (r.error.kind) {
      case "validation":
        return NextResponse.json({ error: "validation_failed", details: r.error.errors }, { status: 400 });
      case "duplicate_uid":
        return NextResponse.json({ error: "duplicate_uid", message: r.error.message }, { status: 409 });
      case "missing_ref":
        return NextResponse.json({ error: "missing_ref", message: r.error.message }, { status: 422 });
      case "constraint_violation":
        return NextResponse.json({ error: "constraint_violation", message: r.error.message }, { status: 422 });
      default:
        return NextResponse.json({ error: "internal_error", message: r.error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ nfc_tag: r.value }, { status: 201 });
}
