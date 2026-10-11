import "server-only";
import type { NewKingData, PostData, PostEntry } from "@/components/cards/types";
import { logoUrl } from "@/components/Badge";
import { board, latestKingChange, todaysMovers, type Snapshot } from "./data";
import { formatPKR, initials } from "./format";
import type { BoardEntry } from "./ranking";
import { formatPktDate, isSamePktDay } from "./time";

function entry(e: BoardEntry): PostEntry {
  return {
    rank: e.rank,
    name: e.listing.name,
    initials: initials(e.listing.name),
    logoUrl: logoUrl(e.listing.logo_path),
    category: e.listing.category,
    city: e.listing.city,
    total: formatPKR(e.total),
  };
}

/** Today's daily post: the all-time board's top 9 (Darbar wide uses 1–7, Truck square uses 1–9). */
export function postData(snap: Snapshot): PostData {
  return { date: formatPktDate(snap.now), entries: board(snap, "all").slice(0, 9).map(entry) };
}

export interface KingAlert {
  data: NewKingData;
  /** True if the throne changed hands today (PKT): that is when the alert should be posted. */
  today: boolean;
  at: Date;
}

export function newKing(snap: Snapshot): KingAlert | null {
  const change = latestKingChange(snap);
  if (!change) return null;
  const current = board(snap, "all").find((e) => e.listing.id === change.king.id);
  if (!current) return null;
  const at = new Date(change.at);
  return {
    data: { date: formatPktDate(at), king: entry(current), previous: change.previous?.name ?? null },
    today: isSamePktDay(at, snap.now),
    at,
  };
}

export interface Captions {
  x: string;
  linkedin: string;
  instagram: string;
}

const hashtag = (s: string) => `#${s.replace(/[^\p{L}\p{N}]+/gu, "")}`;

export function captions(snap: Snapshot): Captions {
  const b = board(snap, "all");
  const date = formatPktDate(snap.now);
  if (b.length === 0) {
    const empty = `The Takht is empty. Be the first to sit on it: takht.pk`;
    return { x: empty, linkedin: empty, instagram: empty };
  }
  const king = b[0];
  const alert = newKing(snap);
  const crowned = alert?.today ? alert.data.previous : null;
  const movers = todaysMovers(snap).filter((m) => m.listing.id !== king.listing.id).slice(0, 2);
  const moverText = movers.map((m) => `${m.listing.name} (${m.from ? `#${m.from} → ` : "new at "}#${m.to})`).join(", ");
  const handle = (e: BoardEntry) => `${e.listing.name} (${e.listing.city})`;
  const top3 = b
    .slice(0, 3)
    .map((e) => `#${e.rank} ${handle(e)} · ${formatPKR(e.total)}`)
    .join("\n");

  const headline = crowned
    ? `👑 New king! ${king.listing.name} has taken the Takht from ${crowned}.`
    : `👑 ${king.listing.name} is still on the Takht.`;

  const x = [
    headline,
    moverText ? `Big moves: ${moverText}.` : null,
    `Rs ${(king.total + 1).toLocaleString("en-US")} takes #1. takht.pk`,
  ]
    .filter(Boolean)
    .join("\n");

  const linkedin = [
    `Takht board, ${date}`,
    "",
    headline,
    "",
    top3,
    moverText ? `\nBiggest climbers today: ${moverText}.` : null,
    "",
    "Takht is a pay-to-rank board for Pakistani businesses: pay Rs 1 more than the business above you and its rank is yours. Totals never reset.",
    "",
    `Claim #1 for ${formatPKR(king.total + 1)} at takht.pk`,
  ]
    .filter((x) => x !== null)
    .join("\n");

  const tags = [
    "#Takht",
    "#Pakistan",
    "#PakistaniBusiness",
    "#SmallBusinessPakistan",
    hashtag(king.listing.city),
    hashtag(king.listing.category),
    "#Leaderboard",
    "#SupportLocal",
  ];
  const instagram = [
    headline,
    "",
    top3,
    moverText ? `\n🚀 ${moverText}` : null,
    "",
    `Think you deserve the Takht? ${formatPKR(king.total + 1)} takes #1. Link in bio: takht.pk`,
    "",
    [...new Set(tags)].join(" "),
  ]
    .filter((x) => x !== null)
    .join("\n");

  return { x, linkedin, instagram };
}
