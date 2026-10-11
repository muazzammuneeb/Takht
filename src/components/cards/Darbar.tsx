import { Crown } from "../Crown";
import { rankLabel, type CardData, type PostData } from "./types";

function DarBadge({ logoUrl, initials, className }: { logoUrl: string | null; initials: string; className?: string }) {
  return <div className={`dar-badge ${className ?? ""}`}>{logoUrl ? <img src={logoUrl} alt="" /> : initials}</div>;
}

function Frames() {
  return (
    <>
      <div className="dar-frame-1" />
      <div className="dar-frame-2" />
    </>
  );
}

export function DarbarCard({ d }: { d: CardData }) {
  return (
    <div className="art art-sq dar dar-card">
      <Frames />
      <div className="dar-wordmark">
        <Crown size={52} strokeWidth={2} />
        <b>TAKHT</b>
        <span className="ur" lang="ur">
          تخت
        </span>
      </div>
      <DarBadge logoUrl={d.logoUrl} initials={d.initials} />
      <div className="dar-card-name">{d.name}</div>
      <div className="dar-card-rank">#{d.rank}</div>
      <div className="dar-card-label">{rankLabel(d.rank)}</div>
      <div className="dar-card-scope">{d.scope}</div>
      <div className="dar-card-foot">
        <span>{d.date}</span>
        {d.rank === 1 && (
          <span className="ur" lang="ur">
            مبارک ہو
          </span>
        )}
        <span className="site">takht.pk</span>
      </div>
    </div>
  );
}

/** 1200×675 daily post for X and LinkedIn: #1 hero + ranks 2–7. */
export function DarbarWidePost({ d }: { d: PostData }) {
  const [king, ...rest] = d.entries;
  return (
    <div className="art art-wide dar dar-wide">
      <Frames />
      <div className="dar-wide-hero">
        <div className="dar-wordmark">
          <Crown size={36} strokeWidth={2.2} />
          <b>TAKHT</b>
        </div>
        <div className="ur title" lang="ur">
          آج کا بادشاہ
        </div>
        {king ? (
          <>
            <DarBadge logoUrl={king.logoUrl} initials={king.initials} />
            <div className="dar-wide-name">{king.name}</div>
            <div className="dar-wide-meta">
              {king.category} · {king.city}
            </div>
            <div className="dar-wide-total">{king.total}</div>
          </>
        ) : (
          <div className="dar-wide-name">The Takht is empty</div>
        )}
      </div>
      <div className="dar-wide-list">
        <div className="dar-wide-head">
          <span>THE BOARD</span>
          <span>{d.date}</span>
        </div>
        {rest.slice(0, 6).map((e) => (
          <div className="dar-wide-row" key={e.rank}>
            <span className="r">{e.rank}</span>
            <span className="n">
              {e.name}
              <small>
                {e.category} · {e.city}
              </small>
            </span>
            <span className="t">{e.total}</span>
          </div>
        ))}
        <div className="dar-wide-foot">
          <span>takht.pk</span>
          <span className="ur" lang="ur">
            تخت پہ کون؟
          </span>
        </div>
      </div>
    </div>
  );
}
