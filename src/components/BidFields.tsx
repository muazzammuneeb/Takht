"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { MIN_BID } from "@/lib/config";
import { formatPKR } from "@/lib/format";
import { rankAfterPaying } from "@/lib/ranking";
import type { BoardScope } from "@/lib/types";

export interface OptionLite {
  rank: number;
  price: number;
  holder: string | null;
}
export interface ScopeData {
  /** Other listings' totals in rank order (ids only, no private data). */
  board: { listing: { id: string }; total: number }[];
  options: OptionLite[];
  own: number;
}
export interface MethodLite {
  id: string;
  label: string;
  details: { label: string; value: string }[];
}

export interface BidFieldsProps {
  listingId: string | null;
  scopes: Record<BoardScope, ScopeData>;
  methods: MethodLite[];
  testMode: boolean;
  initialAmount?: number;
  initialScope?: BoardScope;
  defaults?: Record<string, string>;
  submitLabel: string;
}

const SCOPE_LABEL: Record<BoardScope, string> = { all: "All-time", today: "Today" };

export function BidFields(p: BidFieldsProps) {
  const [scope, setScope] = useState<BoardScope>(p.initialScope ?? "all");
  const [amount, setAmount] = useState<string>(
    p.defaults?.amount || String(p.initialAmount ?? p.scopes[scope].options[0]?.price ?? MIN_BID),
  );
  const [method, setMethod] = useState(p.methods[0]?.id ?? "");
  const n = Number(amount.replace(/[,\s]/g, ""));
  const valid = Number.isInteger(n) && n >= MIN_BID;
  const data = p.scopes[scope];

  return (
    <>
      <div className="segmented" role="group" aria-label="Which board">
        {(Object.keys(SCOPE_LABEL) as BoardScope[]).map((s) => (
          <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)}>
            {SCOPE_LABEL[s]}
          </button>
        ))}
      </div>

      {data.options.length > 0 ? (
        <div className="options" role="group" aria-label="Take a rank">
          {data.options.map((o) => (
            <button
              key={o.rank}
              type="button"
              className="option"
              aria-pressed={Number(amount) === o.price}
              onClick={() => setAmount(String(o.price))}
            >
              <span>
                <span className="rank">{o.holder ? `Take #${o.rank}` : `Join at #${o.rank}`}</span>
                <small>{o.holder ? `from ${o.holder}` : "Get on the board"}</small>
              </span>
              <span className="price">{formatPKR(o.price)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="notice">You hold #1 on the {SCOPE_LABEL[scope].toLowerCase()} board. Add more to keep it safe.</p>
      )}

      <div className="field">
        <label htmlFor="amount">Amount (PKR)</label>
        <input
          id="amount"
          name="amount"
          inputMode="numeric"
          pattern="[0-9,]*"
          autoComplete="off"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
          required
        />
        <div className="hint" aria-live="polite">
          {valid ? (
            <>
              {formatPKR(n)} puts you at <strong>#{rankAfterPaying(p.scopes.all.board, p.listingId, p.scopes.all.own, n)}</strong> all-time
              and <strong>#{rankAfterPaying(p.scopes.today.board, p.listingId, p.scopes.today.own, n)}</strong> today (if nobody else bids first).
            </>
          ) : (
            <>Minimum bid is {formatPKR(MIN_BID)}, whole rupees only.</>
          )}
        </div>
      </div>

      {p.testMode ? (
        <p className="notice small">Test payments mode: bids are marked paid instantly. No money moves.</p>
      ) : (
        <>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>Pay {valid ? formatPKR(n) : ""} to one of these, then tell us the reference</legend>
            <div className="pay-methods">
              {p.methods.map((m) => (
                <label key={m.id} className="pay-method" style={{ cursor: "pointer", marginBottom: 0 }}>
                  <span className="check">
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                    <span>{m.label}</span>
                  </span>
                  <dl>
                    {m.details.map((d) => (
                      <div key={d.label} style={{ display: "contents" }}>
                        <dt>{d.label}</dt>
                        <dd>{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="payment_ref">Transaction reference / TID</label>
            <input id="payment_ref" name="payment_ref" defaultValue={p.defaults?.payment_ref} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="proof">…or a screenshot of the payment</label>
            <input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp" />
            <div className="hint">Your bid counts once we confirm the payment, usually within a few hours.</div>
          </div>
        </>
      )}
      <Submit label={p.submitLabel} />
    </>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-block" type="submit" disabled={pending}>
      {pending ? "Submitting…" : label}
    </button>
  );
}
