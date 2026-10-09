import type { Bid, BidStatus, Listing, ListingStatus } from "../types";

export interface NewListing {
  name: string;
  slug: string;
  website: string;
  category: string;
  city: string;
  tagline: string;
  logo_path: string | null;
  contact: string | null;
}

export interface NewBid {
  listing_id: string;
  amount: number;
  status: BidStatus;
  payment_method: string | null;
  payment_ref: string | null;
  proof_path: string | null;
}

/**
 * The only contract the app depends on. Implementations: local JSON (dev) and Supabase.
 * Ranking is done in src/lib/ranking.ts, not in the store, so stores stay dumb.
 */
export interface Store {
  listListings(): Promise<Listing[]>;
  getListingBySlug(slug: string): Promise<Listing | null>;
  getListing(id: string): Promise<Listing | null>;
  slugExists(slug: string): Promise<boolean>;
  createListing(input: NewListing): Promise<Listing>;
  setListingStatus(id: string, status: ListingStatus): Promise<void>;

  listBids(): Promise<Bid[]>;
  getBid(id: string): Promise<Bid | null>;
  createBid(input: NewBid): Promise<Bid>;
  setBidStatus(id: string, status: BidStatus): Promise<void>;

  /** Stores a file under `key` (e.g. "logos/abc.png", "proofs/xyz.jpg"). */
  putFile(key: string, data: Uint8Array, contentType: string): Promise<void>;
  getFile(key: string): Promise<{ data: Uint8Array; contentType: string } | null>;
}
