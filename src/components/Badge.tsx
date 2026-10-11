import { initials } from "@/lib/format";

export function logoUrl(logoPath: string | null): string | null {
  return logoPath ? `/u/${logoPath}` : null;
}

export function Badge({ name, logoPath, large }: { name: string; logoPath: string | null; large?: boolean }) {
  const src = logoUrl(logoPath);
  return (
    <span className={`badge${large ? " badge-lg" : ""}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}
