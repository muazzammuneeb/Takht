"use client";

import { useState } from "react";
import { CARD_STYLE_LABELS, CARD_STYLES, type CardStyle } from "@/lib/config";
import { ArtPreview } from "./ArtPreview";
import { ShareCard } from "./cards";
import { MinimalCard } from "./cards/Minimal";

export interface ScopeOption {
  id: string;
  label: string;
  rank: number;
}

const ACCENTS = { green: "#0A6B3B", blue: "#1F4FD1" } as const;

export function ShareCards({
  slug,
  name,
  initials,
  logoUrl,
  date,
  scopes,
  defaultStyle,
  defaultScope,
}: {
  slug: string;
  name: string;
  initials: string;
  logoUrl: string | null;
  date: string;
  scopes: ScopeOption[];
  defaultStyle: CardStyle;
  defaultScope: string;
}) {
  const [style, setStyle] = useState<CardStyle>(defaultStyle);
  const [scopeId, setScopeId] = useState(defaultScope);
  const [accent, setAccent] = useState<keyof typeof ACCENTS>("green");
  const scope = scopes.find((s) => s.id === scopeId) ?? scopes[0];
  const d = { name, initials, logoUrl, date, rank: scope.rank, scope: scope.label };

  return (
    <div>
      <div className="share-controls" style={{ marginBottom: 12 }}>
        <div className="segmented" role="group" aria-label="Card style">
          {CARD_STYLES.map((s) => (
            <button key={s} type="button" aria-pressed={style === s} onClick={() => setStyle(s)}>
              {CARD_STYLE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="field" style={{ maxWidth: 420, margin: "0 auto 12px" }}>
        <label htmlFor="card-scope">Show my rank</label>
        <select id="card-scope" value={scope.id} onChange={(e) => setScopeId(e.target.value)}>
          {scopes.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.rank} {s.label}
            </option>
          ))}
        </select>
      </div>
      {style === "minimal" && (
        <div className="share-controls" style={{ marginBottom: 12 }}>
          <div className="segmented" role="group" aria-label="Accent colour">
            {(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((a) => (
              <button key={a} type="button" aria-pressed={accent === a} onClick={() => setAccent(a)}>
                {a === "green" ? "Green" : "Blue"}
              </button>
            ))}
          </div>
        </div>
      )}
      <ArtPreview width={1080} height={1080} filename={`takht-${slug}-${style}-rank-${scope.rank}.png`}>
        {style === "minimal" ? <MinimalCard d={d} accent={ACCENTS[accent]} /> : <ShareCard style={style} d={d} />}
      </ArtPreview>
    </div>
  );
}
