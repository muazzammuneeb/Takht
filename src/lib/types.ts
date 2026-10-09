export type ListingStatus = "pending" | "live" | "rejected" | "hidden";
export type BidStatus = "pending" | "paid" | "failed";

export interface Listing {
  id: string;
  name: string;
  slug: string;
  website: string;
  category: string;
  city: string;
  tagline: string;
  logo_path: string | null;
  status: ListingStatus;
  contact: string | null;
  created_at: string; // ISO
}

export interface Bid {
  id: string;
  listing_id: string;
  amount: number; // whole PKR
  status: BidStatus;
  created_at: string; // ISO
  /** When the bid was marked paid. This is the time the money "counts" on the boards. */
  paid_at: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  proof_path: string | null;
}

export type BoardScope = "all" | "today";

export interface BoardFilters {
  category?: string;
  city?: string;
}
