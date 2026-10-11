"use client";

import { useActionState } from "react";
import { placeBid, type FormState } from "@/app/actions";
import { BidFields, type BidFieldsProps } from "./BidFields";

export function BidForm(props: Omit<BidFieldsProps, "submitLabel" | "defaults"> & { listingId: string }) {
  const [state, action] = useActionState<FormState, FormData>(placeBid, {});
  return (
    <form action={action}>
      <input type="hidden" name="listing_id" value={props.listingId} />
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <BidFields {...props} defaults={state.fields} submitLabel={props.testMode ? "Pay and take the rank" : "Submit payment"} />
    </form>
  );
}
