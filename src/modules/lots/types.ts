export type Lot = {
  id: string;
  stock_id: string;
  lot_code: string;
  quantity: string; // postgres numeric returns as string in supabase-js
  expiry_at: string | null;
  location: string | null;
  received_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LotCreateInput = {
  stock_id: string;
  lot_code: string;
  quantity?: number;
  expiry_at?: string | null;
  location?: string | null;
  received_at?: string | null;
  notes?: string | null;
};

export type LotUpdateInput = {
  lot_code?: string;
  quantity?: number;
  expiry_at?: string | null;
  location?: string | null;
  received_at?: string | null;
  notes?: string | null;
};
