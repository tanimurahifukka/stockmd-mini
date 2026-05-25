export type Stock = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  default_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type StockCreateInput = {
  sku: string;
  name: string;
  unit?: string;
  default_location?: string | null;
  notes?: string | null;
};

export type StockUpdateInput = {
  name?: string;
  unit?: string;
  default_location?: string | null;
  notes?: string | null;
};

export type ListQuery = {
  limit: number;
  offset: number;
  include_deleted: boolean;
};
