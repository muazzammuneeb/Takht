import type { Metadata } from "next";
import Link from "next/link";
import { adminLogout, setBidStatus, setListingStatus } from "@/app/actions";
import { CopyButton, LoginForm } from "@/components/AdminBits";
import { ArtPreview } from "@/components/ArtPreview";
import { DarbarWidePost, NewKingPost, TruckSquarePost } from "@/components/cards";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { board, snapshot } from "@/lib/data";
import { formatPKR } from "@/lib/format";
import { captions, newKing, postData } from "@/lib/posts";
import { formatPktDate, formatPktDateTime, pktDateKey } from "@/lib/time";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function StatusButton({ action, id, status, label, danger }: { action: (fd: FormData) => Promise<void>; id: string; status: string; label: string; danger?: boolean }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`btn btn-sm ${danger ? "btn-danger" : status === "paid" || status === "live" ? "" : "btn-ghost"}`}>{label}</button>
    </form>
  );
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return <p className="notice">Set ADMIN_PASSWORD (and ADMIN_SECRET) in the environment to enable the admin area.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;

  const snap = await snapshot();
  const byId = new Map(snap.listings.map((l) => [l.id, l]));
  const pendingListings = snap.listings.filter((l) => l.status === "pending");
  const pendingBids = snap.bids.filter((b) => b.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const allTotals = new Map(board(snap, "all").map((e) => [e.listing.id, e]));
  const others = snap.listings.filter((l) => l.status === "live" || l.status === "hidden");
  const post = postData(snap);
  const king = newKing(snap);
  const caps = captions(snap);
  const day = pktDateKey(snap.now);

  const bidsFor = (l: Listing) => snap.bids.filter((b) => b.listing_id === l.id);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <form action={adminLogout}>
          <button className="btn btn-ghost btn-sm">Log out</button>
        </form>
      </div>
      <p className="muted small">
        {pendingListings.length} pending listing{pendingListings.length === 1 ? "" : "s"} · {pendingBids.length} payment
        {pendingBids.length === 1 ? "" : "s"} to check
      </p>

      <section className="panel" id="pending">
        <h2>Pending listings</h2>
        {pendingListings.length === 0 && <p className="muted">Nothing to review.</p>}
        {pendingListings.map((l) => {
          const bids = bidsFor(l);
          return (
            <div className="admin-card" key={l.id}>
              <h3>
                <Link href={`/l/${l.slug}`}>{l.name}</Link>
              </h3>
              <p className="small" style={{ marginBottom: 4 }}>
                {l.tagline || <span className="muted">No tagline</span>}
              </p>
              <p className="small muted" style={{ marginBottom: 4 }}>
                {l.category} · {l.city} · <a href={l.website} target="_blank" rel="noopener noreferrer nofollow">{l.website}</a>
              </p>
              <p className="small muted">
                Contact: {l.contact ?? "—"} · Added {formatPktDateTime(new Date(l.created_at))} · Bids:{" "}
                {bids.map((b) => `${formatPKR(b.amount)} (${b.status})`).join(", ") || "none"}
              </p>
              <div className="admin-actions">
                <StatusButton action={setListingStatus} id={l.id} status="live" label="Approve" />
                <StatusButton action={setListingStatus} id={l.id} status="rejected" label="Reject" danger />
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel" id="payments">
        <h2>Payments</h2>
        {pendingBids.length === 0 && <p className="muted">No payments waiting.</p>}
        {pendingBids.map((b) => {
          const l = byId.get(b.listing_id);
          return (
            <div className="admin-card" key={b.id}>
              <h3>
                {formatPKR(b.amount)} · {l ? <Link href={`/l/${l.slug}`}>{l.name}</Link> : "Unknown listing"}
                {l && l.status !== "live" && <span className="muted small"> ({l.status})</span>}
              </h3>
              <p className="small muted">
                {formatPktDateTime(new Date(b.created_at))} · {b.payment_method ?? "—"} · Ref: <strong>{b.payment_ref ?? "—"}</strong>
                {b.proof_path && (
                  <>
                    {" "}
                    · <a href={`/admin/file/${b.proof_path}`} target="_blank" rel="noopener">View screenshot</a>
                  </>
                )}
                {l?.contact && <> · Contact: {l.contact}</>}
              </p>
              <div className="admin-actions">
                <StatusButton action={setBidStatus} id={b.id} status="paid" label="Mark paid" />
                <StatusButton action={setBidStatus} id={b.id} status="failed" label="Mark failed" danger />
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel" id="todays-post">
        <h2>Today&apos;s Post</h2>
        <p className="muted small">{formatPktDate(snap.now)} · board as of {formatPktDateTime(snap.now)} PKT</p>
        <div className="post-grid">
          <div>
            <h3>Darbar wide · X &amp; LinkedIn</h3>
            <ArtPreview width={1200} height={675} filename={`takht-${day}-darbar-wide.png`}>
              <DarbarWidePost d={post} />
            </ArtPreview>
            <h3 style={{ fontSize: 16 }}>X caption</h3>
            <div className="caption-box">{caps.x}</div>
            <CopyButton text={caps.x} label="Copy X caption" />
            <h3 style={{ fontSize: 16, marginTop: 16 }}>LinkedIn caption</h3>
            <div className="caption-box">{caps.linkedin}</div>
            <CopyButton text={caps.linkedin} label="Copy LinkedIn caption" />
          </div>
          <hr className="divider" />
          <div>
            <h3>Truck Art square · Instagram</h3>
            <ArtPreview width={1080} height={1080} filename={`takht-${day}-truck-square.png`}>
              <TruckSquarePost d={post} />
            </ArtPreview>
            <h3 style={{ fontSize: 16 }}>Instagram caption</h3>
            <div className="caption-box">{caps.instagram}</div>
            <CopyButton text={caps.instagram} label="Copy Instagram caption" />
          </div>
          <hr className="divider" />
          <div>
            <h3>New King alert</h3>
            {king ? (
              <>
                <p className={king.today ? "notice" : "muted small"}>
                  {king.today ? "#1 changed hands today. Post this one!" : "No change at #1 today. Latest change:"}{" "}
                  {king.data.king.name}
                  {king.data.previous ? ` took the Takht from ${king.data.previous}` : " became the first king"} on{" "}
                  {formatPktDateTime(king.at)}.
                </p>
                <ArtPreview width={1080} height={1080} filename={`takht-${pktDateKey(king.at)}-new-king.png`}>
                  <NewKingPost d={king.data} />
                </ArtPreview>
              </>
            ) : (
              <p className="muted">No king yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel" id="listings">
        <h2>Live &amp; hidden listings</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {others.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/l/${l.slug}`}>{l.name}</Link>
                    <div className="muted">
                      {l.category} · {l.city}
                    </div>
                  </td>
                  <td>{allTotals.get(l.id) ? `#${allTotals.get(l.id)!.rank} · ${formatPKR(allTotals.get(l.id)!.total)}` : "—"}</td>
                  <td>{l.status}</td>
                  <td>
                    {l.status === "live" ? (
                      <StatusButton action={setListingStatus} id={l.id} status="hidden" label="Hide" danger />
                    ) : (
                      <StatusButton action={setListingStatus} id={l.id} status="live" label="Unhide" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
