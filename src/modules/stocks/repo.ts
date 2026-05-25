import { getServerSupabase } from "@/lib/supabase/server";
import type { Stock, StockCreateInput } from "./types";

export type RepoError = {
  kind: "duplicate_sku" | "db_error";
  message: string;
};

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RepoError };

export async function insertStock(
  input: StockCreateInput,
): Promise<RepoResult<Stock>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("stocks")
    .insert({
      sku: input.sku,
      name: input.name,
      unit: input.unit ?? "piece",
      default_location: input.default_location ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single<Stock>();

  if (error) {
    // Postgres unique_violation = 23505
    if (error.code === "23505") {
      return {
        ok: false,
        error: { kind: "duplicate_sku", message: `sku '${input.sku}' already exists` },
      };
    }
    return { ok: false, error: { kind: "db_error", message: error.message } };
  }
  if (!data) {
    return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  }
  return { ok: true, value: data };
}
