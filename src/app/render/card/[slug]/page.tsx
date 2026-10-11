import { notFound } from "next/navigation";
import { logoUrl } from "@/components/Badge";
import { ShareCard } from "@/components/cards";
import { MinimalCard } from "@/components/cards/Minimal";
import { CARD_STYLES, defaultCardStyle, type CardStyle } from "@/lib/config";
import { cardScopes, defaultCardScope, snapshot } from "@/lib/data";
import { store } from "@/lib/db";
import { initials } from "@/lib/format";
import { formatPktDate } from "@/lib/time";

export const dynamic = "force-dynamic";

/** 1080×1080 share card, e.g. /render/card/kolachi-grill?style=truck&scope=category */
export default async function RenderCard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ style?: string; scope?: string; accent?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const listing = await store().getListingBySlug(slug);
  if (!listing || listing.status !== "live") notFound();
  const snap = await snapshot();
  const scopes = cardScopes(snap, listing);
  const scope = scopes.find((s) => s.id === sp.scope) ?? defaultCardScope(scopes);
  if (!scope) notFound();
  const style = (CARD_STYLES as string[]).includes(sp.style ?? "") ? (sp.style as CardStyle) : defaultCardStyle(listing.category);
  const d = {
    name: listing.name,
    initials: initials(listing.name),
    logoUrl: logoUrl(listing.logo_path),
    rank: scope.rank,
    scope: scope.label,
    date: formatPktDate(snap.now),
  };
  return (
    <div id="art">
      {style === "minimal" && sp.accent === "blue" ? <MinimalCard d={d} accent="#1F4FD1" /> : <ShareCard style={style} d={d} />}
    </div>
  );
}
