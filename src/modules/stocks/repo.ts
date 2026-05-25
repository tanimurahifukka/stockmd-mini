import { getServerSupabase } from "@/lib/supabase/server";
import type { ListQuery } from "@/lib/query";
import type { Stock, StockCreateInput, StockUpdateInput } from "./types";

export type RepoError = {
  kind: "duplicate_sku" | "not_found" | "db_error";
  message: string;
};

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RepoError };

export async function insertStock(input: StockCreateInput): Promise<RepoResult<Stock>> {
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
    if (error.code === "23505") {
      return {
        ok: false,
        error: { kind: "duplicate_sku", message: `sku '${input.sku}' already exists` },
      };
    }
    return { ok: false, error: { kind: "db_error", message: error.message } };
  }
  if (!data) return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  return { ok: true, value: data };
}

export type ListResult = {
  items: Stock[];
  total: number;
  limit: number;
  offset: number;
};

export async function listStocks(q: ListQuery): Promise<RepoResult<ListResult>> {
  const supabase = getServerSupabase();
  let query = supabase.from("stocks").select("*", { count: "exact" });
  if (!q.include_deleted) query = query.is("deleted_at", null);
  query = query.order("created_at", { ascending: false }).range(q.offset, q.offset + q.limit - 1);
  const { data, error, count } = await query;
  if (error) return { ok: false, error: { kind: "db_error", message: error.message } };
  return {
    ok: true,
    value: {
      items: (data ?? []) as Stock[],
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    },
  };
}

export async function getStock(id: string): Promise<RepoResult<Stock>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .eq("id", id)
    .maybeSingle<Stock>();
  if (error) return { ok: false, error: { kind: "db_error", message: error.message } };
  if (!data) return { ok: false, error: { kind: "not_found", message: `stock ${id} not found` } };
  return { ok: true, value: data };
}

export async function updateStock(
  id: string,
  patch: StockUpdateInput,
): Promise<RepoResult<Stock>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("stocks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Stock>();
  if (error) return { ok: false, error: { kind: "db_error", message: error.message } };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `stock ${id} not found or deleted` } };
  }
  return { ok: true, value: data };
}

export async function softDeleteStock(id: string): Promise<RepoResult<Stock>> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("stocks")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Stock>();
  if (error) return { ok: false, error: { kind: "db_error", message: error.message } };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `stock ${id} not found or already deleted` } };
  }
  return { ok: true, value: data };
}
