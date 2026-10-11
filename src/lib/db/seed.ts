import { slugify } from "../format";
import type { Bid, Listing } from "../types";
import seed from "./seed-data.json";

interface SeedListing {
  key: string;
  name: string;
  category: string;
  city: string;
  website: string;
  tagline: string;
  status: Listing["status"];
  ago: number;
}
interface SeedBid {
  listing: string;
  amount: number;
  ago: number;
  status?: Bid["status"];
  method?: string;
  ref?: string;
}

/** Builds seed rows with timestamps relative to `now`. */
export function buildSeed(now = new Date()): { listings: Listing[]; bids: Bid[] } {
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();
  const ids = new Map<string, string>();
  const listings: Listing[] = (seed.listings as SeedListing[]).map((l, i) => {
    const id = `seed-l${String(i + 1).padStart(2, "0")}`;
    ids.set(l.key, id);
    return {
      id,
      name: l.name,
      slug: slugify(l.name),
      website: l.website,
      category: l.category,
      city: l.city,
      tagline: l.tagline,
      logo_path: null,
      status: l.status,
      contact: null,
      created_at: at(l.ago),
    };
  });
  const bids: Bid[] = (seed.bids as SeedBid[]).map((b, i) => {
    const status = b.status ?? "paid";
    return {
      id: `seed-b${String(i + 1).padStart(2, "0")}`,
      listing_id: ids.get(b.listing)!,
      amount: b.amount,
      status,
      created_at: at(b.ago),
      paid_at: status === "paid" ? at(b.ago) : null,
      payment_method: b.method ?? "seed",
      payment_ref: b.ref ?? null,
      proof_path: null,
    };
  });
  return { listings, bids };
}
