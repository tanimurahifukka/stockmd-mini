import { NextResponse } from "next/server";
import { createStock } from "@/modules/stocks";

export const dynamic = "force-dynamic";

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

  const result = await createStock(raw);
  if (!result.ok) {
    switch (result.error.kind) {
      case "validation":
        return NextResponse.json(
          { error: "validation_failed", details: result.error.errors },
          { status: 400 },
        );
      case "duplicate_sku":
        return NextResponse.json(
          { error: "duplicate_sku", message: result.error.message },
          { status: 409 },
        );
      case "internal":
        return NextResponse.json(
          { error: "internal_error", message: result.error.message },
          { status: 500 },
        );
    }
  }

  return NextResponse.json({ stock: result.value }, { status: 201 });
}
