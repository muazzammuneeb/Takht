"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logIn, logOut, requireAdmin } from "@/lib/admin";
import { CATEGORIES, MIN_BID } from "@/lib/config";
import { store } from "@/lib/db";
import { normalizeWebsite, slugify } from "@/lib/format";
import { paymentProvider } from "@/lib/payments";
import type { BidStatus, Listing, ListingStatus } from "@/lib/types";

export interface FormState {
  error?: string;
  fields?: Record<string, string>;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function str(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[,\s]/g, "").replace(/^rs\.?/i, ""));
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function saveImage(file: FormDataEntryValue | null, folder: "logos" | "proofs", maxBytes: number): Promise<string | null | Error> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return new Error("Images must be PNG, JPG or WebP.");
  if (file.size > maxBytes) return new Error(`Images must be under ${Math.round(maxBytes / 1_000_000)} MB.`);
  const key = `${folder}/${randomUUID()}.${ext}`;
  await store().putFile(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return key;
}

/** Validates payment fields, creates the bid and runs it through the payment provider. */
async function createBidFor(listing: Listing, fd: FormData): Promise<{ error: string } | { ok: true }> {
  const amount = parseAmount(str(fd, "amount", 20));
  if (amount === null) return { error: "Enter an amount in whole rupees." };
  if (amount < MIN_BID) return { error: `The minimum bid is Rs ${MIN_BID}.` };
  if (amount > 100_000_000) return { error: "That amount is too large. Contact us for big bids." };

  const provider = paymentProvider();
  const method = str(fd, "method", 30) || (provider.mode === "test" ? "test" : "");
  const ref = str(fd, "payment_ref", 80);
  let proof: string | null = null;
  if (provider.needsProof) {
    if (!provider.methods().some((m) => m.id === method)) return { error: "Choose how you paid." };
    const saved = await saveImage(fd.get("proof"), "proofs", 5_000_000);
    if (saved instanceof Error) return { error: saved.message };
    proof = saved;
    if (!ref && !proof) return { error: "Add the transaction reference or a screenshot of the payment." };
  }

  const bid = await store().createBid({
    listing_id: listing.id,
    amount,
    status: "pending",
    payment_method: method || null,
    payment_ref: ref || null,
    proof_path: proof,
  });
  const outcome = await provider.begin(bid, listing);
  if (outcome.status === "paid") await store().setBidStatus(bid.id, "paid");
  if (outcome.status === "redirect") redirect(outcome.url);
  return { ok: true };
}

function revalidateBoards(slug?: string) {
  revalidatePath("/");
  revalidatePath("/today");
  if (slug) revalidatePath(`/l/${slug}`);
  revalidatePath("/admin");
}

export async function placeBid(_prev: FormState, fd: FormData): Promise<FormState> {
  const listing = await store().getListing(str(fd, "listing_id", 60));
  if (!listing || listing.status === "rejected" || listing.status === "hidden") {
    return { error: "This listing can't take bids right now." };
  }
  const res = await createBidFor(listing, fd);
  if ("error" in res) return { error: res.error, fields: { amount: str(fd, "amount", 20), payment_ref: str(fd, "payment_ref", 80) } };
  revalidateBoards(listing.slug);
  redirect(`/l/${listing.slug}?bid=${paymentProvider().mode === "test" ? "paid" : "pending"}`);
}

export async function addListing(_prev: FormState, fd: FormData): Promise<FormState> {
  const fields: Record<string, string> = {};
  for (const k of ["name", "website", "category", "city", "tagline", "contact", "amount", "payment_ref"]) fields[k] = str(fd, k, 200);
  const fail = (error: string): FormState => ({ error, fields });

  // Honeypot: real people never fill this.
  if (str(fd, "company_fax")) return fail("Something went wrong. Please try again.");

  const name = str(fd, "name", 60);
  if (name.length < 2) return fail("Enter your business name.");
  const website = normalizeWebsite(str(fd, "website", 200));
  if (!website) return fail("Enter a valid website or social page URL.");
  const category = str(fd, "category", 40);
  if (!(CATEGORIES as readonly string[]).includes(category)) return fail("Choose a category.");
  const city = str(fd, "city", 40);
  if (city.length < 2) return fail("Enter your city.");
  const tagline = str(fd, "tagline", 90);
  const contact = str(fd, "contact", 120);
  if (contact.length < 5) return fail("Add a phone number or email so we can reach you about approval.");
  if (str(fd, "agree") !== "on") return fail("Please accept the rules.");

  const amount = parseAmount(fields.amount);
  if (amount === null || amount < MIN_BID) return fail(`Your first bid must be at least Rs ${MIN_BID}.`);

  const logo = await saveImage(fd.get("logo"), "logos", 1_000_000);
  if (logo instanceof Error) return fail(logo.message);

  const base = slugify(name);
  let slug = base;
  for (let i = 2; await store().slugExists(slug); i++) slug = `${base}-${i}`;

  const listing = await store().createListing({ name, slug, website, category, city, tagline, logo_path: logo, contact });
  const res = await createBidFor(listing, fd);
  if ("error" in res) {
    // Keep the half-made listing out of admin's queue.
    await store().setListingStatus(listing.id, "rejected");
    return fail(res.error);
  }
  revalidateBoards(slug);
  redirect(`/l/${slug}?added=1`);
}

// ---------- Admin ----------

export async function adminLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await logIn(str(fd, "password", 200)))) return { error: "Wrong password." };
  redirect("/admin");
}

export async function adminLogout() {
  await logOut();
  redirect("/admin");
}

const LISTING_STATUSES: ListingStatus[] = ["pending", "live", "rejected", "hidden"];
const BID_STATUSES: BidStatus[] = ["pending", "paid", "failed"];

export async function setListingStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status") as ListingStatus;
  if (!LISTING_STATUSES.includes(status)) return;
  const listing = await store().getListing(str(fd, "id", 60));
  if (!listing) return;
  await store().setListingStatus(listing.id, status);
  revalidateBoards(listing.slug);
}

export async function setBidStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status") as BidStatus;
  if (!BID_STATUSES.includes(status)) return;
  const bid = await store().getBid(str(fd, "id", 60));
  if (!bid) return;
  await store().setBidStatus(bid.id, status);
  const listing = await store().getListing(bid.listing_id);
  revalidateBoards(listing?.slug);
}
