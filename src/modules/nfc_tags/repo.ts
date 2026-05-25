import { getServerSupabase } from "@/lib/supabase/server";
import type { ListQuery } from "@/lib/query";
import type { NfcTag, NfcTagCreateInput, NfcTagUpdateInput } from "./types";

export type RepoError = {
  kind: "duplicate_uid" | "missing_ref" | "constraint_violation" | "not_found" | "db_error";
  message: string;
};
export type RepoResult<T> = { ok: true; value: T } | { ok: false; error: RepoError };
export type ListResult = { items: NfcTag[]; total: number; limit: number; offset: number };

function mapDbError(error: { code?: string; message: string }, ctx: string): RepoError {
  if (error.code === "23505") return { kind: "duplicate_uid", message: "uid already exists" };
  if (error.code === "23503") return { kind: "missing_ref", message: "lot_id or stock_id does not reference an existing row" };
  if (error.code === "23514") return { kind: "constraint_violation", message: "may not bind to both lot and stock" };
  return { kind: "db_error", message: `${ctx}: ${error.message}` };
}

export async function insertNfcTag(input: NfcTagCreateInput): Promise<RepoResult<NfcTag>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("nfc_tags")
    .insert({
      uid: input.uid,
      label: input.label ?? null,
      lot_id: input.lot_id ?? null,
      stock_id: input.stock_id ?? null,
      bound_at: input.bound_at ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single<NfcTag>();
  if (error) return { ok: false, error: mapDbError(error, "insertNfcTag") };
  if (!data) return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  return { ok: true, value: data };
}

export async function listNfcTags(q: ListQuery): Promise<RepoResult<ListResult>> {
  const supabase = getServerSupabase();
  let query = supabase.from("nfc_tags").select("*", { count: "exact" });
  if (!q.include_deleted) query = query.is("deleted_at", null);
  query = query.order("created_at", { ascending: false }).range(q.offset, q.offset + q.limit - 1);
  const { data, error, count } = await query;
  if (error) return { ok: false, error: mapDbError(error, "listNfcTags") };
  return {
    ok: true,
    value: {
      items: (data ?? []) as NfcTag[],
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    },
  };
}

export async function getNfcTag(id: string): Promise<RepoResult<NfcTag>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("nfc_tags")
    .select("*")
    .eq("id", id)
    .maybeSingle<NfcTag>();
  if (error) return { ok: false, error: mapDbError(error, "getNfcTag") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `nfc_tag ${id} not found` } };
  return { ok: true, value: data };
}

export async function updateNfcTag(id: string, patch: NfcTagUpdateInput): Promise<RepoResult<NfcTag>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("nfc_tags")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<NfcTag>();
  if (error) return { ok: false, error: mapDbError(error, "updateNfcTag") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `nfc_tag ${id} not found or deleted` } };
  return { ok: true, value: data };
}

export async function softDeleteNfcTag(id: string): Promise<RepoResult<NfcTag>> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("nfc_tags")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<NfcTag>();
  if (error) return { ok: false, error: mapDbError(error, "softDeleteNfcTag") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `nfc_tag ${id} not found or already deleted` } };
  return { ok: true, value: data };
}
