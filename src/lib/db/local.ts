import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Bid, BidStatus, Listing, ListingStatus } from "../types";
import { buildSeed } from "./seed";
import type { NewBid, NewListing, Store } from "./store";

interface Data {
  listings: Listing[];
  bids: Bid[];
  files: Record<string, string>; // key -> content type
}

/**
 * JSON-file store for local development. Auto-seeds on first use. Not for production:
 * a single process owns the file and writes are serialised through `queue`.
 */
export class LocalStore implements Store {
  private data: Data | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private dir: string) {}

  private get file() {
    return path.join(this.dir, "takht.json");
  }

  private async load(): Promise<Data> {
    if (this.data) return this.data;
    try {
      this.data = JSON.parse(await fs.readFile(this.file, "utf8")) as Data;
    } catch {
      const seed = buildSeed();
      this.data = { ...seed, files: {} };
      await this.save();
    }
    return this.data!;
  }

  private async save() {
    await fs.mkdir(this.dir, { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.data, null, 2));
    await fs.rename(tmp, this.file);
  }

  private mutate<T>(fn: (d: Data) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const d = await this.load();
      const out = fn(d);
      await this.save();
      return out;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async listListings() {
    return [...(await this.load()).listings];
  }
  async getListingBySlug(slug: string) {
    return (await this.load()).listings.find((l) => l.slug === slug) ?? null;
  }
  async getListing(id: string) {
    return (await this.load()).listings.find((l) => l.id === id) ?? null;
  }
  async slugExists(slug: string) {
    return (await this.load()).listings.some((l) => l.slug === slug);
  }
  createListing(input: NewListing) {
    return this.mutate((d) => {
      const l: Listing = { ...input, id: randomUUID(), status: "pending", created_at: new Date().toISOString() };
      d.listings.push(l);
      return l;
    });
  }
  setListingStatus(id: string, status: ListingStatus) {
    return this.mutate((d) => {
      const l = d.listings.find((x) => x.id === id);
      if (l) l.status = status;
    });
  }

  async listBids() {
    return [...(await this.load()).bids];
  }
  async getBid(id: string) {
    return (await this.load()).bids.find((b) => b.id === id) ?? null;
  }
  createBid(input: NewBid) {
    return this.mutate((d) => {
      const now = new Date().toISOString();
      const b: Bid = { ...input, id: randomUUID(), created_at: now, paid_at: input.status === "paid" ? now : null };
      d.bids.push(b);
      return b;
    });
  }
  setBidStatus(id: string, status: BidStatus) {
    return this.mutate((d) => {
      const b = d.bids.find((x) => x.id === id);
      if (!b) return;
      b.status = status;
      b.paid_at = status === "paid" ? new Date().toISOString() : null;
    });
  }

  async putFile(key: string, data: Uint8Array, contentType: string) {
    const target = path.join(this.dir, "files", key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    await this.mutate((d) => {
      d.files[key] = contentType;
    });
  }
  async getFile(key: string) {
    const d = await this.load();
    const contentType = d.files[key];
    if (!contentType) return null;
    try {
      const data = await fs.readFile(path.join(this.dir, "files", key));
      return { data: new Uint8Array(data), contentType };
    } catch {
      return null;
    }
  }
}
