/** Rs 48,500 — thousands separators, no decimals. */
export function formatPKR(amount: number): string {
  const n = Math.round(amount);
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "listing";
}

export function withUtm(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "takht");
    return u.toString();
  } catch {
    return url;
  }
}

export function normalizeWebsite(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function ordinalRank(rank: number): string {
  return `#${rank}`;
}
