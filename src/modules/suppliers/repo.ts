import { getServerSupabase } from "@/lib/supabase/server";
import type { ListQuery } from "@/lib/query";
import type { Supplier, SupplierCreateInput, SupplierUpdateInput } from "./types";

export type RepoError = {
  kind: "duplicate_slug" | "not_found" | "db_error";
  message: string;
};
export type RepoResult<T> = { ok: true; value: T } | { ok: false; error: RepoError };
export type ListResult = { items: Supplier[]; total: number; limit: number; offset: number };

function mapDbError(error: { code?: string; message: string }, ctx: string): RepoError {
  if (error.code === "23505") {
    return { kind: "duplicate_slug", message: "slug already exists" };
  }
  return { kind: "db_error", message: `${ctx}: ${error.message}` };
}

export async function insertSupplier(input: SupplierCreateInput): Promise<RepoResult<Supplier>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: input.name,
      slug: input.slug,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single<Supplier>();
  if (error) return { ok: false, error: mapDbError(error, "insertSupplier") };
  if (!data) return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  return { ok: true, value: data };
}

export async function listSuppliers(q: ListQuery): Promise<RepoResult<ListResult>> {
  const supabase = getServerSupabase();
  let query = supabase.from("suppliers").select("*", { count: "exact" });
  if (!q.include_deleted) query = query.is("deleted_at", null);
  query = query.order("name", { ascending: true }).range(q.offset, q.offset + q.limit - 1);
  const { data, error, count } = await query;
  if (error) return { ok: false, error: mapDbError(error, "listSuppliers") };
  return {
    ok: true,
    value: {
      items: (data ?? []) as Supplier[],
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    },
  };
}

export async function getSupplier(id: string): Promise<RepoResult<Supplier>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle<Supplier>();
  if (error) return { ok: false, error: mapDbError(error, "getSupplier") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `supplier ${id} not found` } };
  return { ok: true, value: data };
}

export async function updateSupplier(id: string, patch: SupplierUpdateInput): Promise<RepoResult<Supplier>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Supplier>();
  if (error) return { ok: false, error: mapDbError(error, "updateSupplier") };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `supplier ${id} not found or deleted` } };
  }
  return { ok: true, value: data };
}

export async function softDeleteSupplier(id: string): Promise<RepoResult<Supplier>> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("suppliers")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<Supplier>();
  if (error) return { ok: false, error: mapDbError(error, "softDeleteSupplier") };
  if (!data) {
    return { ok: false, error: { kind: "not_found", message: `supplier ${id} not found or already deleted` } };
  }
  return { ok: true, value: data };
}
