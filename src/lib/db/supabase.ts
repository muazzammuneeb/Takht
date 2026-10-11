import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Bid, BidStatus, Listing, ListingStatus } from "../types";
import type { NewBid, NewListing, Store } from "./store";

const BUCKET = "takht";

/** Supabase (Postgres) store. Server-side only: uses the service-role key. Schema: supabase/migrations. */
export class SupabaseStore implements Store {
  private db: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  private check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
    return res.data;
  }

  async listListings() {
    return this.check(await this.db.from("listings").select("*").order("created_at")) as Listing[];
  }
  async getListingBySlug(slug: string) {
    return this.check(await this.db.from("listings").select("*").eq("slug", slug).maybeSingle()) as Listing | null;
  }
  async getListing(id: string) {
    return this.check(await this.db.from("listings").select("*").eq("id", id).maybeSingle()) as Listing | null;
  }
  async slugExists(slug: string) {
    return (await this.getListingBySlug(slug)) !== null;
  }
  async createListing(input: NewListing) {
    return this.check(await this.db.from("listings").insert({ ...input, status: "pending" }).select().single()) as Listing;
  }
  async setListingStatus(id: string, status: ListingStatus) {
    this.check(await this.db.from("listings").update({ status }).eq("id", id));
  }

  async listBids() {
    // Supabase caps a select at 1000 rows by default, so page through.
    const out: Bid[] = [];
    for (let from = 0; ; from += 1000) {
      const page = this.check(
        await this.db.from("bids").select("*").order("created_at").range(from, from + 999),
      ) as Bid[];
      out.push(...page.map((b) => ({ ...b, amount: Number(b.amount) })));
      if (page.length < 1000) return out;
    }
  }
  async getBid(id: string) {
    const b = this.check(await this.db.from("bids").select("*").eq("id", id).maybeSingle()) as Bid | null;
    return b && { ...b, amount: Number(b.amount) };
  }
  async createBid(input: NewBid) {
    const row = { ...input, paid_at: input.status === "paid" ? new Date().toISOString() : null };
    const b = this.check(await this.db.from("bids").insert(row).select().single()) as Bid;
    return { ...b, amount: Number(b.amount) };
  }
  async setBidStatus(id: string, status: BidStatus) {
    const paid_at = status === "paid" ? new Date().toISOString() : null;
    this.check(await this.db.from("bids").update({ status, paid_at }).eq("id", id));
  }

  async putFile(key: string, data: Uint8Array, contentType: string) {
    const { error } = await this.db.storage.from(BUCKET).upload(key, data, { contentType, upsert: true });
    if (error) throw new Error(`Supabase storage: ${error.message}`);
  }
  async getFile(key: string) {
    const { data, error } = await this.db.storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return { data: new Uint8Array(await data.arrayBuffer()), contentType: data.type || "application/octet-stream" };
  }
}
