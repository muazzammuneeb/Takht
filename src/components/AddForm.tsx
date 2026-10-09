"use client";

import { useActionState } from "react";
import { addListing, type FormState } from "@/app/actions";
import { BidFields, type BidFieldsProps } from "./BidFields";

export function AddForm({
  categories,
  cities,
  bid,
}: {
  categories: readonly string[];
  cities: readonly string[];
  bid: Omit<BidFieldsProps, "submitLabel" | "defaults" | "listingId">;
}) {
  const [state, action] = useActionState<FormState, FormData>(addListing, {});
  const f = state.fields ?? {};
  return (
    <form action={action}>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <section className="panel">
        <h2>Your business</h2>
        <div className="field">
          <label htmlFor="name">Business name</label>
          <input id="name" name="name" required maxLength={60} defaultValue={f.name} autoComplete="organization" />
        </div>
        <div className="field">
          <label htmlFor="website">Website or social page</label>
          <input id="website" name="website" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" required placeholder="yourbusiness.pk or instagram.com/you" defaultValue={f.website} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" required defaultValue={f.category ?? ""}>
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" list="city-list" required maxLength={40} defaultValue={f.city} autoComplete="address-level2" />
          <datalist id="city-list">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="tagline">One-line tagline</label>
          <input id="tagline" name="tagline" maxLength={90} defaultValue={f.tagline} />
          <div className="hint">Up to 90 characters.</div>
        </div>
        <div className="field">
          <label htmlFor="logo">Logo (optional)</label>
          <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
          <div className="hint">Square PNG/JPG/WebP under 1 MB. We use your initials if you skip this.</div>
        </div>
        <div className="field">
          <label htmlFor="contact">Phone or email (private)</label>
          <input id="contact" name="contact" required maxLength={120} defaultValue={f.contact} />
          <div className="hint">Only used to reach you about approval and payments. Never shown publicly.</div>
        </div>
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="company_fax">Leave this empty</label>
          <input id="company_fax" name="company_fax" tabIndex={-1} autoComplete="off" />
        </div>
      </section>

      <section className="panel">
        <h2>Your first bid</h2>
        <p className="muted small">Minimum Rs 100. Pick a rank to take or enter any amount.</p>
        <div className="field">
          <label className="check">
            <input type="checkbox" name="agree" required />
            <span>
              I agree to the <a href="/rules">rules</a>: listings are reviewed before going live and payments are not
              refundable.
            </span>
          </label>
        </div>
        <BidFields {...bid} listingId={null} defaults={state.fields} submitLabel={bid.testMode ? "List and pay" : "Submit listing and payment"} />
      </section>
    </form>
  );
}
