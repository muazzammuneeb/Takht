import "server-only";
import type { ScopeData } from "@/components/BidFields";
import { board, standing, type Snapshot } from "./data";
import { paymentProvider } from "./payments";
import { takeOptions } from "./ranking";
import type { BoardScope } from "./types";

/** Serialisable props for the bid form; strips everything but ids and totals from the boards. */
export function bidScopes(snap: Snapshot, listingId: string | null): Record<BoardScope, ScopeData> {
  const make = (scope: BoardScope): ScopeData => {
    const b = board(snap, scope);
    const own = listingId ? standing(b, listingId).total : 0;
    return {
      board: b.map((e) => ({ listing: { id: e.listing.id }, total: e.total })),
      options: takeOptions(b, listingId, own).map((o) => ({ rank: o.rank, price: o.price, holder: o.holder?.name ?? null })),
      own,
    };
  };
  return { all: make("all"), today: make("today") };
}

export function paymentProps() {
  const p = paymentProvider();
  return { methods: p.methods(), testMode: p.mode === "test" };
}
