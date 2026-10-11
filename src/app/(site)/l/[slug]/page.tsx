import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, logoUrl } from "@/components/Badge";
import { BidForm } from "@/components/BidForm";
import { ShareCards } from "@/components/ShareCards";
import { bidScopes, paymentProps } from "@/lib/bidProps";
import { defaultCardStyle } from "@/lib/config";
import { board, cardScopes, defaultCardScope, snapshot, standing } from "@/lib/data";
import { store } from "@/lib/db";
import { formatPKR, initials, withUtm } from "@/lib/format";
import { formatPktDate, formatPktDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ bid?: string; added?: string }>;

async function load(slug: string) {
  const listing = await store().getListingBySlug(slug);
  if (!listing || listing.status === "rejected" || listing.status === "hidden") return null;
  return listing;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const listing = await load((await params).slug);
  if (!listing) return {};
  return {
    title: listing.name,
    description: listing.tagline || `${listing.name} on the Takht board`,
    robots: listing.status === "live" ? undefined : { index: false },
  };
}

export default async function ListingPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;
  const listing = await load(slug);
  if (!listing) notFound();

  const snap = await snapshot();
  const all = standing(board(snap, "all"), listing.id);
  const today = standing(board(snap, "today"), listing.id);
  const myBids = snap.bids.filter((b) => b.listing_id === listing.id);
  const paid = myBids
    .filter((b) => b.status === "paid")
    .sort((a, b) => Date.parse(b.paid_at ?? b.created_at) - Date.parse(a.paid_at ?? a.created_at));
  const pendingCount = myBids.filter((b) => b.status === "pending").length;
  const live = listing.status === "live";
  const scopes = live ? cardScopes(snap, listing) : [];
  const defScope = defaultCardScope(scopes);

  return (
    <>
      {sp.added && (
        <p className="notice" role="status">
          Thanks! <strong>{listing.name}</strong> is waiting for approval. We check new listings within a day; your bid
          counts the moment the listing goes live{paymentProps().testMode ? "" : " and the payment is confirmed"}.
        </p>
      )}
      {sp.bid === "paid" && (
        <p className="notice" role="status">
          Payment received. Your new rank is below.
        </p>
      )}
      {sp.bid === "pending" && (
        <p className="notice" role="status">
          Got it! We&apos;ll confirm your payment shortly and your rank updates as soon as we do.
        </p>
      )}
      {!live && !sp.added && <p className="notice">This listing is waiting for approval.</p>}

      <div className="listing-head">
        <Badge name={listing.name} logoPath={listing.logo_path} large />
        <div style={{ minWidth: 0 }}>
          <h1>{listing.name}</h1>
          {listing.tagline && <p>{listing.tagline}</p>}
          <p className="muted small">
            {listing.category} · {listing.city} ·{" "}
            <a href={withUtm(listing.website)} target="_blank" rel="noopener nofollow ugc">
              Visit website ↗
            </a>
          </p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-value">{all.rank ? `#${all.rank}` : "—"}</div>
          <div className="stat-label">All-time</div>
        </div>
        <div className="stat">
          <div className="stat-value">{today.rank ? `#${today.rank}` : "—"}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat">
          <div className="stat-value money">{formatPKR(all.total)}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>
      {pendingCount > 0 && (
        <p className="muted small">
          {pendingCount} payment{pendingCount > 1 ? "s" : ""} waiting for confirmation.
        </p>
      )}

      <section className="panel" aria-labelledby="take">
        <h2 id="take">Take a rank</h2>
        <p className="muted small">You only pay the difference: Rs 1 more than the business holding the rank, minus what you already have.</p>
        <BidForm listingId={listing.id} scopes={bidScopes(snap, listing.id)} {...paymentProps()} />
      </section>

      <section className="panel" aria-labelledby="share">
        <h2 id="share">Share your rank</h2>
        {defScope ? (
          <>
            <p className="muted small">Download a 1080×1080 card for Instagram, WhatsApp or LinkedIn. Cards never show what you paid.</p>
            <ShareCards
              slug={listing.slug}
              name={listing.name}
              initials={initials(listing.name)}
              logoUrl={logoUrl(listing.logo_path)}
              date={formatPktDate(snap.now)}
              scopes={scopes}
              defaultStyle={defaultCardStyle(listing.category)}
              defaultScope={defScope.id}
            />
          </>
        ) : (
          <p className="muted">Your share card appears here once you&apos;re live on the board.</p>
        )}
      </section>

      <section className="panel" aria-labelledby="history">
        <h2 id="history">Bid history</h2>
        {paid.length === 0 ? (
          <p className="muted">No paid bids yet.</p>
        ) : (
          <table className="history">
            <tbody>
              {paid.map((b) => (
                <tr key={b.id}>
                  <td className="muted">{formatPktDateTime(new Date(b.paid_at ?? b.created_at))}</td>
                  <td>{formatPKR(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
