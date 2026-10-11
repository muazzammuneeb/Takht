import Link from "next/link";
import { Suspense } from "react";
import { CATEGORIES, CITIES, MIN_BID } from "@/lib/config";
import { board, liveCities, snapshot } from "@/lib/data";
import { formatPKR } from "@/lib/format";
import { priceToTake } from "@/lib/ranking";
import { formatPktDate } from "@/lib/time";
import type { BoardFilters, BoardScope } from "@/lib/types";
import { Badge } from "./Badge";
import { Crown } from "./Crown";
import { FilterBar } from "./FilterBar";

export type BoardSearchParams = Promise<{ category?: string; city?: string }>;

function addHref(rank: number, amount: number, scope: BoardScope) {
  const q = new URLSearchParams({ rank: String(rank), amount: String(amount) });
  if (scope === "today") q.set("board", "today");
  return `/add?${q}`;
}

export async function BoardView({ scope, searchParams }: { scope: BoardScope; searchParams: BoardSearchParams }) {
  const sp = await searchParams;
  const filters: BoardFilters = {
    category: sp.category && (CATEGORIES as readonly string[]).includes(sp.category) ? sp.category : undefined,
    city: sp.city || undefined,
  };
  const snap = await snapshot();
  const rows = board(snap, scope, filters);
  const king = rows[0];
  const claimPrice = priceToTake(rows, null, 1) ?? MIN_BID;
  const cities = [...new Set([...CITIES, ...liveCities(snap)])];
  const scopeLabel = [filters.category, filters.city].filter(Boolean).join(" · ");
  const filterQs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <section className="panel framed claim" aria-labelledby="claim-title">
        <Crown size={40} className="crown" />
        <p className="urdu" lang="ur">
          {scope === "today" ? "آج کا بادشاہ" : "تخت پہ کون؟"}
        </p>
        <h1 id="claim-title" className="visually-hidden">
          {scope === "today" ? "Today's board" : "All-time board"}
        </h1>
        <p className="claim-king">
          {king ? (
            <>
              <strong>{king.listing.name}</strong> sits on the Takht{scopeLabel ? ` in ${scopeLabel}` : ""}
              {scope === "today" ? " today" : ""} with {formatPKR(king.total)}
            </>
          ) : (
            <>The Takht is empty{scopeLabel ? ` in ${scopeLabel}` : ""}{scope === "today" ? " today" : ""}.</>
          )}
        </p>
        <Link className="btn" href={addHref(1, claimPrice, scope)}>
          Claim #1 for {formatPKR(claimPrice)}
        </Link>
      </section>

      <nav className="tabs" aria-label="Board">
        <Link href={`/${filterQs ? `?${filterQs}` : ""}`} aria-current={scope === "all" ? "page" : undefined}>
          All-time
        </Link>
        <Link href={`/today${filterQs ? `?${filterQs}` : ""}`} aria-current={scope === "today" ? "page" : undefined}>
          Today
        </Link>
      </nav>

      <Suspense>
        <FilterBar categories={CATEGORIES} cities={cities} />
      </Suspense>

      {scope === "today" && <p className="muted small">Bids paid on {formatPktDate(snap.now)} (PKT). Resets at midnight.</p>}

      {rows.length === 0 ? (
        <div className="empty">
          <p>No one here yet{scope === "today" ? " today" : ""}.</p>
          <Link className="btn btn-ghost" href={addHref(1, MIN_BID, scope)}>
            Be the first for {formatPKR(MIN_BID)}
          </Link>
        </div>
      ) : (
        <ol className="board">
          {rows.map((e) => {
            const price = e.total + 1;
            return (
              <li key={e.listing.id} className="row">
                <span className={`row-rank${e.rank <= 3 ? " top" : ""}`}>
                  <span className="visually-hidden">Rank </span>
                  {e.rank}
                </span>
                <Badge name={e.listing.name} logoPath={e.listing.logo_path} />
                <div className="row-main">
                  <Link className="row-name" href={`/l/${e.listing.slug}`}>
                    {e.listing.name}
                  </Link>
                  {e.listing.tagline && <div className="row-tagline">{e.listing.tagline}</div>}
                  <div className="row-meta">
                    {e.listing.category} · {e.listing.city}
                  </div>
                </div>
                <div className="row-side">
                  <span className="row-total">{formatPKR(e.total)}</span>
                  <Link className="row-take" href={addHref(e.rank, price, scope)}>
                    Take #{e.rank} for {formatPKR(price)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>
        Already listed? Open your listing to pay only the difference.
      </p>
    </>
  );
}
