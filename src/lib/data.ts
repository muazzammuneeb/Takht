import "server-only";
import { store } from "./db";
import { buildBoard, kingHistory, movers, rankOf, type BoardEntry } from "./ranking";
import type { Bid, BoardFilters, BoardScope, Listing } from "./types";

export interface Snapshot {
  listings: Listing[];
  bids: Bid[];
  now: Date;
}

export async function snapshot(): Promise<Snapshot> {
  const s = store();
  const [listings, bids] = await Promise.all([s.listListings(), s.listBids()]);
  return { listings, bids, now: new Date() };
}

export function board(snap: Snapshot, scope: BoardScope, filters?: BoardFilters): BoardEntry[] {
  return buildBoard(snap.listings, snap.bids, { scope, now: snap.now, filters });
}

/** Cities that appear on live listings, for the filter dropdown. */
export function liveCities(snap: Snapshot): string[] {
  const set = new Set<string>();
  for (const l of snap.listings) if (l.status === "live") set.add(l.city.trim());
  return [...set].sort((a, b) => a.localeCompare(b));
}

export interface Standing {
  rank: number | null;
  total: number;
}

export function standing(b: BoardEntry[], listingId: string): Standing {
  const e = b.find((x) => x.listing.id === listingId);
  return { rank: rankOf(b, listingId), total: e?.total ?? 0 };
}

export interface CardScope {
  id: "all" | "category" | "category-city";
  label: string;
  rank: number;
}

/**
 * Scopes a listing can brag about on a share card, with its all-time rank in each.
 * Labels follow the brief: "in Food · Karachi", "in Tech · Pakistan".
 */
export function cardScopes(snap: Snapshot, listing: Listing): CardScope[] {
  const out: CardScope[] = [];
  const add = (id: CardScope["id"], label: string, filters?: BoardFilters) => {
    const r = rankOf(board(snap, "all", filters), listing.id);
    if (r !== null) out.push({ id, label, rank: r });
  };
  add("category-city", `in ${listing.category} · ${listing.city}`, { category: listing.category, city: listing.city });
  add("category", `in ${listing.category} · Pakistan`, { category: listing.category });
  add("all", "in Pakistan");
  return out;
}

/** Best (lowest) rank wins; on equal rank prefer the broader scope. */
export function defaultCardScope(scopes: CardScope[]): CardScope | null {
  if (scopes.length === 0) return null;
  return scopes.reduce((best, s) => (s.rank <= best.rank ? s : best));
}

export function latestKingChange(snap: Snapshot) {
  const h = kingHistory(snap.listings, snap.bids);
  return h.length ? h[h.length - 1] : null;
}

export function todaysMovers(snap: Snapshot) {
  return movers(snap.listings, snap.bids, snap.now);
}
