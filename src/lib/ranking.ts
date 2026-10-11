import { MIN_BID } from "./config";
import { pktDayEnd, pktDayStart } from "./time";
import type { Bid, BoardFilters, BoardScope, Listing } from "./types";

/**
 * Pure ranking maths. Everything here is deterministic given (listings, bids, now) so it is
 * unit-tested in ranking.test.ts. The DB layer only fetches rows; it never ranks.
 */

export interface BoardEntry {
  rank: number;
  listing: Listing;
  total: number;
  /** Time the listing reached its current total (latest counted paid bid). Earlier wins ties. */
  reachedAt: number;
}

export interface BoardOptions {
  scope: BoardScope;
  now: Date;
  filters?: BoardFilters;
  /** Only count bids paid strictly before this time (used to replay history). */
  before?: Date;
}

function paidTime(bid: Bid): number | null {
  if (bid.status !== "paid") return null;
  const t = Date.parse(bid.paid_at ?? bid.created_at);
  return Number.isNaN(t) ? null : t;
}

export function matchesFilters(listing: Listing, filters?: BoardFilters): boolean {
  if (!filters) return true;
  if (filters.category && listing.category !== filters.category) return false;
  if (filters.city && listing.city.trim().toLowerCase() !== filters.city.trim().toLowerCase()) return false;
  return true;
}

/**
 * Totals per listing for a scope. All-time = every paid bid. Today = paid bids whose paid time
 * falls in the current PKT calendar day (resets at midnight PKT).
 */
export function computeTotals(
  bids: Bid[],
  opts: { scope: BoardScope; now: Date; before?: Date },
): Map<string, { total: number; reachedAt: number }> {
  const from = opts.scope === "today" ? pktDayStart(opts.now).getTime() : -Infinity;
  const to = Math.min(
    opts.scope === "today" ? pktDayEnd(opts.now).getTime() : Infinity,
    opts.before ? opts.before.getTime() : Infinity,
  );
  const totals = new Map<string, { total: number; reachedAt: number }>();
  for (const bid of bids) {
    const t = paidTime(bid);
    if (t === null || t < from || t >= to) continue;
    const cur = totals.get(bid.listing_id) ?? { total: 0, reachedAt: -Infinity };
    cur.total += bid.amount;
    cur.reachedAt = Math.max(cur.reachedAt, t);
    totals.set(bid.listing_id, cur);
  }
  return totals;
}

export function compareEntries(
  a: { total: number; reachedAt: number; listing: Listing },
  b: { total: number; reachedAt: number; listing: Listing },
): number {
  if (b.total !== a.total) return b.total - a.total;
  if (a.reachedAt !== b.reachedAt) return a.reachedAt - b.reachedAt;
  // Fully deterministic fallback: older listing, then id.
  const ca = Date.parse(a.listing.created_at);
  const cb = Date.parse(b.listing.created_at);
  if (ca !== cb) return ca - cb;
  return a.listing.id < b.listing.id ? -1 : 1;
}

/** Ranked board: live listings with a positive total in the scope, after filters. */
export function buildBoard(listings: Listing[], bids: Bid[], opts: BoardOptions): BoardEntry[] {
  const totals = computeTotals(bids, opts);
  const rows: Omit<BoardEntry, "rank">[] = [];
  for (const listing of listings) {
    if (listing.status !== "live" || !matchesFilters(listing, opts.filters)) continue;
    const t = totals.get(listing.id);
    if (!t || t.total <= 0) continue;
    rows.push({ listing, total: t.total, reachedAt: t.reachedAt });
  }
  rows.sort(compareEntries);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function rankOf(board: BoardEntry[], listingId: string): number | null {
  const e = board.find((x) => x.listing.id === listingId);
  return e ? e.rank : null;
}

/**
 * Price for `listingId` (currently holding `ownTotal` in this board's scope) to take rank `rank`:
 *   holder_total(rank) + 1 - own_total, never below the minimum bid.
 * Returns null when the listing already holds that rank or a better one.
 * A rank one past the end of the board means "get onto the board" and costs the minimum bid.
 */
export function priceToTake(
  board: BoardEntry[],
  listingId: string | null,
  rank: number,
  ownTotal = 0,
): number | null {
  if (!Number.isInteger(rank) || rank < 1) return null;
  const ownRank = listingId ? rankOf(board, listingId) : null;
  if (ownRank !== null && ownRank <= rank) return null;
  if (rank > board.length) {
    if (ownRank !== null || rank > board.length + 1) return null;
    return MIN_BID;
  }
  const holder = board[rank - 1];
  return Math.max(MIN_BID, holder.total + 1 - ownTotal);
}

export interface TakeOption {
  rank: number;
  price: number;
  /** Listing that currently holds the rank (null for "join the board"). */
  holder: Listing | null;
}

/** Every rank above the listing's current position, best first. */
export function takeOptions(board: BoardEntry[], listingId: string | null, ownTotal = 0): TakeOption[] {
  const ownRank = listingId ? rankOf(board, listingId) : null;
  const lastRank = ownRank !== null ? ownRank - 1 : board.length + 1;
  const out: TakeOption[] = [];
  for (let r = 1; r <= lastRank; r++) {
    const price = priceToTake(board, listingId, r, ownTotal);
    if (price === null) continue;
    out.push({ rank: r, price, holder: board[r - 1]?.listing ?? null });
  }
  return out;
}

/** The rank a listing would land on after adding `amount` to its total now (ties lose to incumbents). */
export function rankAfterPaying(
  board: { listing: { id: string }; total: number }[],
  listingId: string | null,
  ownTotal: number,
  amount: number,
): number {
  const newTotal = ownTotal + amount;
  let rank = 1;
  for (const e of board) {
    if (e.listing.id === listingId) continue;
    if (e.total >= newTotal) rank++;
  }
  return rank;
}

export interface KingChange {
  at: number;
  king: Listing;
  previous: Listing | null;
  total: number;
}

/**
 * Replays paid bids in paid-time order and records each time all-time #1 changed hands.
 * Only live listings take part (same population as the public board).
 */
export function kingHistory(listings: Listing[], bids: Bid[]): KingChange[] {
  const live = new Map(listings.filter((l) => l.status === "live").map((l) => [l.id, l]));
  const events = bids
    .map((b) => ({ b, t: paidTime(b) }))
    .filter((x): x is { b: Bid; t: number } => x.t !== null && live.has(x.b.listing_id))
    .sort((x, y) => x.t - y.t);
  const totals = new Map<string, number>();
  let leader: string | null = null;
  const changes: KingChange[] = [];
  for (const { b, t } of events) {
    const total = (totals.get(b.listing_id) ?? 0) + b.amount;
    totals.set(b.listing_id, total);
    if (leader === b.listing_id) continue;
    // The incumbent keeps the throne on a tie because they reached that total first.
    if (leader === null || total > (totals.get(leader) ?? 0)) {
      changes.push({ at: t, king: live.get(b.listing_id)!, previous: leader ? live.get(leader)! : null, total });
      leader = b.listing_id;
    }
  }
  return changes;
}

export interface Mover {
  listing: Listing;
  from: number | null;
  to: number;
  gained: number;
}

/** All-time rank changes between the start of today (PKT) and now, biggest climbers first. */
export function movers(listings: Listing[], bids: Bid[], now: Date): Mover[] {
  const before = buildBoard(listings, bids, { scope: "all", now, before: pktDayStart(now) });
  const after = buildBoard(listings, bids, { scope: "all", now });
  const prev = new Map(before.map((e) => [e.listing.id, e.rank]));
  const out: Mover[] = [];
  for (const e of after) {
    const from = prev.get(e.listing.id) ?? null;
    const gained = from === null ? after.length + 1 - e.rank : from - e.rank;
    if (gained > 0) out.push({ listing: e.listing, from, to: e.rank, gained });
  }
  return out.sort((a, b) => b.gained - a.gained || a.to - b.to);
}
