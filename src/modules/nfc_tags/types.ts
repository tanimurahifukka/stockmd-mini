export type NfcTag = {
  id: string;
  uid: string;
  label: string | null;
  lot_id: string | null;
  stock_id: string | null;
  bound_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NfcTagCreateInput = {
  uid: string;
  label?: string | null;
  lot_id?: string | null;
  stock_id?: string | null;
  bound_at?: string | null;
  notes?: string | null;
};

export type NfcTagUpdateInput = {
  label?: string | null;
  lot_id?: string | null;
  stock_id?: string | null;
  bound_at?: string | null;
  notes?: string | null;
};
