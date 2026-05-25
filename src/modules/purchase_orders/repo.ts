import { getServerSupabase } from "@/lib/supabase/server";
import type { ListQuery } from "@/lib/query";
import type { PurchaseOrder, PurchaseOrderCreateInput, PurchaseOrderUpdateInput } from "./types";

export type RepoError = {
  kind: "duplicate_po_number" | "missing_supplier" | "not_found" | "db_error";
  message: string;
};
export type RepoResult<T> = { ok: true; value: T } | { ok: false; error: RepoError };
export type ListResult = { items: PurchaseOrder[]; total: number; limit: number; offset: number };

function mapDbError(error: { code?: string; message: string }, ctx: string): RepoError {
  if (error.code === "23505") return { kind: "duplicate_po_number", message: "po_number already exists" };
  if (error.code === "23503") return { kind: "missing_supplier", message: "supplier_id does not reference an existing suppliers row" };
  return { kind: "db_error", message: `${ctx}: ${error.message}` };
}

export async function insertPurchaseOrder(input: PurchaseOrderCreateInput): Promise<RepoResult<PurchaseOrder>> {
  const supabase = getServerSupabase();
  const payload: Record<string, unknown> = {
    po_number: input.po_number,
    supplier_id: input.supplier_id,
    status: input.status ?? "draft",
    total_amount: input.total_amount ?? 0,
    currency: input.currency ?? "JPY",
    ordered_at: input.ordered_at ?? null,
    expected_at: input.expected_at ?? null,
    notes: input.notes ?? null,
  };
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert(payload)
    .select("*")
    .single<PurchaseOrder>();
  if (error) return { ok: false, error: mapDbError(error, "insertPurchaseOrder") };
  if (!data) return { ok: false, error: { kind: "db_error", message: "no row returned" } };
  return { ok: true, value: data };
}

export async function listPurchaseOrders(q: ListQuery): Promise<RepoResult<ListResult>> {
  const supabase = getServerSupabase();
  let query = supabase.from("purchase_orders").select("*", { count: "exact" });
  if (!q.include_deleted) query = query.is("deleted_at", null);
  query = query.order("created_at", { ascending: false }).range(q.offset, q.offset + q.limit - 1);
  const { data, error, count } = await query;
  if (error) return { ok: false, error: mapDbError(error, "listPurchaseOrders") };
  return {
    ok: true,
    value: {
      items: (data ?? []) as PurchaseOrder[],
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
    },
  };
}

export async function getPurchaseOrder(id: string): Promise<RepoResult<PurchaseOrder>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle<PurchaseOrder>();
  if (error) return { ok: false, error: mapDbError(error, "getPurchaseOrder") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `purchase_order ${id} not found` } };
  return { ok: true, value: data };
}

export async function updatePurchaseOrder(id: string, patch: PurchaseOrderUpdateInput): Promise<RepoResult<PurchaseOrder>> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<PurchaseOrder>();
  if (error) return { ok: false, error: mapDbError(error, "updatePurchaseOrder") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `purchase_order ${id} not found or deleted` } };
  return { ok: true, value: data };
}

export async function softDeletePurchaseOrder(id: string): Promise<RepoResult<PurchaseOrder>> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle<PurchaseOrder>();
  if (error) return { ok: false, error: mapDbError(error, "softDeletePurchaseOrder") };
  if (!data) return { ok: false, error: { kind: "not_found", message: `purchase_order ${id} not found or already deleted` } };
  return { ok: true, value: data };
}
