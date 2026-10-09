import { describe, expect, it } from "vitest";
import {
  buildBoard,
  kingHistory,
  movers,
  priceToTake,
  rankAfterPaying,
  rankOf,
  takeOptions,
} from "./ranking";
import { pktDateKey, pktDayStart } from "./time";
import type { Bid, Listing } from "./types";

let seq = 0;
function listing(id: string, extra: Partial<Listing> = {}): Listing {
  return {
    id,
    name: id.toUpperCase(),
    slug: id,
    website: `https://${id}.pk`,
    category: "Food",
    city: "Karachi",
    tagline: "",
    logo_path: null,
    status: "live",
    contact: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}
function bid(listing_id: string, amount: number, paidAt: string, status: Bid["status"] = "paid"): Bid {
  return {
    id: `b${++seq}`,
    listing_id,
    amount,
    status,
    created_at: paidAt,
    paid_at: status === "paid" ? paidAt : null,
    payment_method: "test",
    payment_ref: null,
    proof_path: null,
  };
}

// 2026-10-09 12:00 PKT
const NOW = new Date("2026-10-09T07:00:00.000Z");

describe("PKT day boundaries", () => {
  it("midnight PKT is 19:00 UTC the previous day", () => {
    expect(pktDayStart(NOW).toISOString()).toBe("2026-10-08T19:00:00.000Z");
    expect(pktDateKey(new Date("2026-10-08T18:59:59.999Z"))).toBe("2026-10-08");
    expect(pktDateKey(new Date("2026-10-08T19:00:00.000Z"))).toBe("2026-10-09");
  });
});

describe("buildBoard", () => {
  it("orders by total desc and only counts paid bids of live listings", () => {
    const ls = [listing("a"), listing("b"), listing("c"), listing("p", { status: "pending" })];
    const bs = [
      bid("a", 500, "2026-10-01T00:00:00Z"),
      bid("b", 300, "2026-10-01T00:00:00Z"),
      bid("b", 400, "2026-10-02T00:00:00Z"),
      bid("c", 9_999, "2026-10-02T00:00:00Z", "pending"),
      bid("c", 9_999, "2026-10-02T00:00:00Z", "failed"),
      bid("c", 100, "2026-10-02T00:00:00Z"),
      bid("p", 50_000, "2026-10-02T00:00:00Z"),
    ];
    const board = buildBoard(ls, bs, { scope: "all", now: NOW });
    expect(board.map((e) => [e.listing.id, e.total, e.rank])).toEqual([
      ["b", 700, 1],
      ["a", 500, 2],
      ["c", 100, 3],
    ]);
  });

  it("breaks ties by whoever reached the total first (earliest last paid bid)", () => {
    const ls = [listing("early"), listing("late")];
    const bs = [
      bid("late", 200, "2026-10-01T00:00:00Z"),
      bid("early", 500, "2026-10-02T00:00:00Z"),
      bid("late", 300, "2026-10-03T00:00:00Z"), // late reaches 500 after early did
    ];
    const board = buildBoard(ls, bs, { scope: "all", now: NOW });
    expect(board.map((e) => e.listing.id)).toEqual(["early", "late"]);
  });

  it("today board only counts bids paid since midnight PKT and resets at midnight", () => {
    const ls = [listing("a"), listing("b")];
    const bs = [
      bid("a", 10_000, "2026-10-08T18:59:59.000Z"), // 23:59:59 PKT yesterday
      bid("b", 200, "2026-10-08T19:00:00.000Z"), // 00:00:00 PKT today
      bid("a", 150, "2026-10-09T06:00:00.000Z"),
    ];
    const today = buildBoard(ls, bs, { scope: "today", now: NOW });
    expect(today.map((e) => [e.listing.id, e.total])).toEqual([
      ["b", 200],
      ["a", 150],
    ]);
    const all = buildBoard(ls, bs, { scope: "all", now: NOW });
    expect(all.map((e) => [e.listing.id, e.total])).toEqual([
      ["a", 10_150],
      ["b", 200],
    ]);
    // One second before midnight PKT the "today" board is yesterday's.
    const yesterday = buildBoard(ls, bs, { scope: "today", now: new Date("2026-10-08T18:59:59.500Z") });
    expect(yesterday.map((e) => [e.listing.id, e.total])).toEqual([["a", 10_000]]);
  });

  it("applies category and city filters (city case-insensitive) and re-ranks", () => {
    const ls = [
      listing("a", { category: "Tech", city: "Lahore" }),
      listing("b", { category: "Food", city: "karachi" }),
      listing("c", { category: "Food", city: "Lahore" }),
    ];
    const bs = [bid("a", 900, "2026-10-01T00:00:00Z"), bid("b", 500, "2026-10-01T00:00:00Z"), bid("c", 700, "2026-10-01T00:00:00Z")];
    const food = buildBoard(ls, bs, { scope: "all", now: NOW, filters: { category: "Food" } });
    expect(food.map((e) => [e.listing.id, e.rank])).toEqual([
      ["c", 1],
      ["b", 2],
    ]);
    const khi = buildBoard(ls, bs, { scope: "all", now: NOW, filters: { city: "Karachi" } });
    expect(khi.map((e) => e.listing.id)).toEqual(["b"]);
  });
});

describe("priceToTake", () => {
  const ls = [listing("a"), listing("b"), listing("c")];
  const bs = [
    bid("a", 5_000, "2026-10-01T00:00:00Z"),
    bid("b", 2_000, "2026-10-01T00:00:00Z"),
    bid("c", 1_000, "2026-10-01T00:00:00Z"),
  ];
  const board = buildBoard(ls, bs, { scope: "all", now: NOW });

  it("first bid (new listing) pays holder total + 1", () => {
    expect(priceToTake(board, null, 1, 0)).toBe(5_001);
    expect(priceToTake(board, null, 3, 0)).toBe(1_001);
  });

  it("joining at the bottom costs the minimum bid", () => {
    expect(priceToTake(board, null, 4, 0)).toBe(100);
    expect(priceToTake(board, null, 5, 0)).toBeNull();
  });

  it("taking #1 subtracts what the listing already has", () => {
    expect(priceToTake(board, "c", 1, 1_000)).toBe(4_001);
    expect(priceToTake(board, "b", 1, 2_000)).toBe(3_001);
    expect(priceToTake(board, "c", 2, 1_000)).toBe(1_001);
  });

  it("never quotes below the minimum bid", () => {
    const tied = buildBoard(
      [listing("x"), listing("y")],
      [bid("x", 1_000, "2026-10-01T00:00:00Z"), bid("y", 1_000, "2026-10-02T00:00:00Z")],
      { scope: "all", now: NOW },
    );
    // y is tied with x but loses the tie; formula gives 1 → clamped to minimum.
    expect(priceToTake(tied, "y", 1, 1_000)).toBe(100);
  });

  it("returns null for ranks the listing already holds or beats", () => {
    expect(priceToTake(board, "a", 1, 5_000)).toBeNull();
    expect(priceToTake(board, "b", 2, 2_000)).toBeNull();
    expect(priceToTake(board, "b", 3, 2_000)).toBeNull();
  });

  it("paying the quoted price lands exactly on the target rank", () => {
    for (const [id, own] of [["c", 1_000], ["b", 2_000]] as const) {
      for (const opt of takeOptions(board, id, own)) {
        expect(rankAfterPaying(board, id, own, opt.price)).toBe(opt.rank);
      }
    }
    for (const opt of takeOptions(board, null, 0)) {
      expect(rankAfterPaying(board, null, 0, opt.price)).toBe(opt.rank);
    }
  });

  it("ties: matching the holder's total is not enough", () => {
    expect(rankAfterPaying(board, null, 0, 5_000)).toBe(2);
    expect(rankAfterPaying(board, null, 0, 5_001)).toBe(1);
  });

  it("today vs all-time quote against different totals", () => {
    const ls2 = [listing("a"), listing("b")];
    const bs2 = [
      bid("a", 50_000, "2026-09-01T00:00:00Z"),
      bid("a", 300, "2026-10-09T05:00:00Z"),
      bid("b", 1_000, "2026-10-09T04:00:00Z"),
    ];
    const all = buildBoard(ls2, bs2, { scope: "all", now: NOW });
    const today = buildBoard(ls2, bs2, { scope: "today", now: NOW });
    expect(rankOf(all, "b")).toBe(2);
    expect(rankOf(today, "b")).toBe(1);
    expect(priceToTake(all, "b", 1, 1_000)).toBe(49_301);
    expect(priceToTake(today, "a", 1, 300)).toBe(701);
  });
});

describe("takeOptions", () => {
  it("lists every higher rank, best first", () => {
    const ls = [listing("a"), listing("b"), listing("c"), listing("d")];
    const bs = [
      bid("a", 4_000, "2026-10-01T00:00:00Z"),
      bid("b", 3_000, "2026-10-01T00:00:00Z"),
      bid("c", 2_000, "2026-10-01T00:00:00Z"),
      bid("d", 1_000, "2026-10-01T00:00:00Z"),
    ];
    const board = buildBoard(ls, bs, { scope: "all", now: NOW });
    expect(takeOptions(board, "d", 1_000).map((o) => [o.rank, o.price])).toEqual([
      [1, 3_001],
      [2, 2_001],
      [3, 1_001],
    ]);
    expect(takeOptions(board, "a", 4_000)).toEqual([]);
    expect(takeOptions(board, null, 0).map((o) => o.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("kingHistory and movers", () => {
  it("records each change of #1; ties keep the incumbent", () => {
    const ls = [listing("a"), listing("b"), listing("h", { status: "hidden" })];
    const bs = [
      bid("a", 1_000, "2026-10-01T00:00:00Z"),
      bid("b", 1_000, "2026-10-02T00:00:00Z"), // tie → a keeps it
      bid("h", 99_999, "2026-10-02T12:00:00Z"), // hidden, ignored
      bid("b", 1, "2026-10-03T00:00:00Z"), // b takes it
      bid("a", 5_000, "2026-10-04T00:00:00Z"),
    ];
    const h = kingHistory(ls, bs);
    expect(h.map((c) => [c.king.id, c.previous?.id ?? null, c.total])).toEqual([
      ["a", null, 1_000],
      ["b", "a", 1_001],
      ["a", "b", 6_000],
    ]);
  });

  it("movers compares all-time rank at PKT midnight with now", () => {
    const ls = [listing("a"), listing("b"), listing("c")];
    const bs = [
      bid("a", 3_000, "2026-10-01T00:00:00Z"),
      bid("b", 2_000, "2026-10-01T00:00:00Z"),
      bid("c", 1_000, "2026-10-01T00:00:00Z"),
      bid("c", 2_500, "2026-10-09T03:00:00Z"), // today: 3 → 1
    ];
    const m = movers(ls, bs, NOW);
    expect(m.map((x) => [x.listing.id, x.from, x.to])).toEqual([["c", 3, 1]]);
  });
});
