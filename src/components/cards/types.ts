/** Data for a share card. Deliberately has no amount field: share cards never show money. */
export interface CardData {
  name: string;
  initials: string;
  logoUrl: string | null;
  rank: number;
  /** "in Food · Karachi" */
  scope: string;
  /** "9 Oct 2026" */
  date: string;
}

export interface PostEntry {
  rank: number;
  name: string;
  initials: string;
  logoUrl: string | null;
  category: string;
  city: string;
  total: string; // pre-formatted "Rs 48,500"
}

export interface PostData {
  date: string;
  entries: PostEntry[];
}

export interface NewKingData {
  date: string;
  king: PostEntry;
  previous: string | null;
}

export function rankLabel(rank: number): string {
  return rank === 1 ? "Now sitting on the Takht" : "Ranked on the Takht board";
}
