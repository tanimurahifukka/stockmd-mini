import { getServerSupabase } from "@/lib/supabase/server";
import type { ListQuery } from "@/lib/query";
import type { Lot, LotCreateInput, LotUpdateInput } from "./types";

export type RepoError = {
  kind: "duplicate_lot_code" | "missing_stock" | "not_found" | "db_error";
  message: string;
};
export type RepoResult<T> = { ok: true; value: T } | { ok: false; error: RepoError };
export type ListResult = { items: Lot[]; total: number; limit: number; offset: number };

function mapDbError(error: { code?: string; message: string }, ctx: string): RepoError {
  if (error.code === "23505") {
    return { kind: "duplicate_lot_code", message: `lot_code already exists for stock` };
  }
  if (error.code === "23503") {
    return { kind: "missing_stock", message: "stock_id does not reference an existing stocks row" };
  }
  return { kind: "db_error", message: `${ctx}: ${error.message}` };
}

export async function insertLot(input: LotCreateInput): Promise<RepoResult<Lot>> {
  const supabase = getServerSupabase();
  const payload: Record<string, unknown> = {
    stock_id: input.stock_id,
    lot_code: input.lot_code,
    quantity: input.quantity ?? 0,
    expiry_at: input.expiry_at ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
  };
  if (input.received_at) payload.received_at = input.received_at;
  const { data, error } = await supabase
    .from("lots")
    .insert(payload)
    .select("*")
    .single<Lot>();
  if (error) return { ok: false, error: mapDbError(error, "insertLot") };
  if (!data) return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  return { ok: true, value: data };
}

export async function listLots(q: ListQuery): Promise<RepoResult<ListResult>> {
  const supabase = getServerSupabase();
  let query = supabase.from("lots").select("*", { count: "exact" });
  if (!q.include_deleted) query = query.is("deleted_at", null);
  query = query.order("received_at", { ascending: false }).range(q.offset, q.offset + q.limit - 1);
  const { data, error, count } = await query;
  if (error) return { ok: false, error: mapDbError(error, "listLots") };
  return {
    ok: true,
    value: {
      items: (data ?? []) as Lot[],
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    },
  };
}

export async function getLot(id: string): Promise<RepoResult<Lot>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .maybeSingle<Lot>();
  if (error) return { ok: false, error: mapDbError(error, "getLot") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `lot ${id} not found` } };
  return { ok: true, value: data };
}

export async function updateLot(id: string, patch: LotUpdateInput): Promise<RepoResult<Lot>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("lots")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Lot>();
  if (error) return { ok: false, error: mapDbError(error, "updateLot") };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `lot ${id} not found or deleted` } };
  }
  return { ok: true, value: data };
}

export async function softDeleteLot(id: string): Promise<RepoResult<Lot>> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("lots")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Lot>();
  if (error) return { ok: false, error: mapDbError(error, "softDeleteLot") };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `lot ${id} not found or already deleted` } };
  }
  return { ok: true, value: data };
}
