import { rankLabel, type CardData, type NewKingData, type PostData } from "./types";

function Band({ pos, count = 22 }: { pos: "top" | "bottom"; count?: number }) {
  return (
    <div className={`trk-band ${pos}`}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

function TrkBadge({ logoUrl, initials }: { logoUrl: string | null; initials: string }) {
  return <div className="trk-badge">{logoUrl ? <img src={logoUrl} alt="" /> : initials}</div>;
}

const CHIPS = [
  { background: "#C21E5B", color: "#FFFFFF" },
  { background: "#0B7A71", color: "#FFFFFF" },
  { background: "#F2A900", color: "#14204A" },
];

export function TruckCard({ d }: { d: CardData }) {
  return (
    <div className="art art-sq trk trk-card">
      <Band pos="top" />
      <div className="trk-card-top">
        <TrkBadge logoUrl={d.logoUrl} initials={d.initials} />
        <div className="trk-anton trk-card-name">{d.name}</div>
      </div>
      <div className="trk-hero">
        <div className="trk-anton trk-card-rank">#{d.rank}</div>
      </div>
      <div className="trk-anton trk-card-label">{rankLabel(d.rank)}</div>
      <div className="trk-card-scope">{d.scope}</div>
      <div className="trk-card-foot">
        <span className="date">{d.date}</span>
        <span className="ur" lang="ur">
          شاباش
        </span>
        <span className="trk-pill">takht.pk</span>
      </div>
      <Band pos="bottom" />
    </div>
  );
}

/** 1080×1080 Instagram post: #1 hero + ranks 2–9. */
export function TruckSquarePost({ d }: { d: PostData }) {
  const [king, ...rest] = d.entries;
  return (
    <div className="art art-sq trk trk-post">
      <Band pos="top" />
      <div className="trk-post-head">
        <div>
          <div className="trk-anton title">Takht Board</div>
          <div className="date">{d.date}</div>
        </div>
        <div className="ur" lang="ur">
          آج کا بادشاہ
        </div>
      </div>
      {king && (
        <div className="trk-hero">
          <div className="trk-anton rank">#1</div>
          <TrkBadge logoUrl={king.logoUrl} initials={king.initials} />
          <div className="who">
            <div className="trk-anton name">{king.name}</div>
            <div className="meta">
              {king.category} · {king.city}
            </div>
          </div>
          <div className="total">{king.total}</div>
        </div>
      )}
      <div className="trk-rows">
        {rest.slice(0, 8).map((e, i) => (
          <div className="trk-row" key={e.rank}>
            <span className="chip" style={CHIPS[i % 3]}>
              {e.rank}
            </span>
            <span className="n">
              {e.name}
              <small>{e.city}</small>
            </span>
            <span className="t">{e.total}</span>
          </div>
        ))}
      </div>
      <div className="trk-post-foot">
        <span>Pay Rs 1 more. Take the rank.</span>
        <span className="trk-pill">takht.pk</span>
      </div>
      <Band pos="bottom" />
    </div>
  );
}

/** 1080×1080 "New King" alert, posted whenever #1 changes hands. */
export function NewKingPost({ d }: { d: NewKingData }) {
  return (
    <div className="art art-sq trk trk-king">
      <Band pos="top" />
      <div className="trk-anton kicker">Takht alert · {d.date}</div>
      <div className="trk-anton headline">New King</div>
      <div className="ur" lang="ur">
        مبارک ہو
      </div>
      <div className="trk-hero">
        <TrkBadge logoUrl={d.king.logoUrl} initials={d.king.initials} />
        <div className="trk-anton name">{d.king.name}</div>
        <div className="meta">
          {d.king.category} · {d.king.city}
        </div>
      </div>
      <div className="dethroned">
        {d.previous ? (
          <>
            Dethroned <b>{d.previous}</b>
          </>
        ) : (
          <>First to sit on the Takht</>
        )}
      </div>
      <div className="trk-card-foot">
        <span className="date">Who&apos;s next?</span>
        <span className="trk-pill">takht.pk</span>
      </div>
      <Band pos="bottom" />
    </div>
  );
}
