export type PurchaseOrderStatus = "draft" | "submitted" | "received" | "cancelled";

export type PurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  ordered_at: string | null;
  expected_at: string | null;
  total_amount: string;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PurchaseOrderCreateInput = {
  po_number: string;
  supplier_id: string;
  status?: PurchaseOrderStatus;
  ordered_at?: string | null;
  expected_at?: string | null;
  total_amount?: number;
  currency?: string;
  notes?: string | null;
};

export type PurchaseOrderUpdateInput = {
  po_number?: string;
  status?: PurchaseOrderStatus;
  ordered_at?: string | null;
  expected_at?: string | null;
  total_amount?: number;
  currency?: string;
  notes?: string | null;
};
