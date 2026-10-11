import { Crown } from "../Crown";
import { rankLabel, type CardData } from "./types";

export function MinimalCard({ d, accent = "#0A6B3B" }: { d: CardData; accent?: string }) {
  return (
    <div className="art art-sq min">
      <div className="min-top">
        <div className="min-badge">{d.logoUrl ? <img src={d.logoUrl} alt="" /> : d.initials}</div>
        <div className="min-name">{d.name}</div>
      </div>
      <div className="min-rank">
        <span className="hash">#</span>
        {d.rank}
        <span className="min-dot" style={{ background: accent }} />
      </div>
      <div className="min-label">{rankLabel(d.rank)}</div>
      <div className="min-scope">
        {d.scope} · {d.date}
      </div>
      <div className="min-foot">
        <span className="brand">
          <Crown size={34} strokeWidth={2.4} color="#101012" />
          TAKHT
        </span>
        <span>takht.pk</span>
      </div>
    </div>
  );
}
