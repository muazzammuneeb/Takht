import type { CardStyle } from "@/lib/config";
import { DarbarCard } from "./Darbar";
import { MinimalCard } from "./Minimal";
import { TruckCard } from "./TruckArt";
import type { CardData } from "./types";

export { DarbarWidePost } from "./Darbar";
export { NewKingPost, TruckSquarePost } from "./TruckArt";
export type { CardData, NewKingData, PostData, PostEntry } from "./types";

export function ShareCard({ style, d }: { style: CardStyle; d: CardData }) {
  if (style === "truck") return <TruckCard d={d} />;
  if (style === "minimal") return <MinimalCard d={d} />;
  return <DarbarCard d={d} />;
}
