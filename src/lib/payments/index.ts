import "server-only";
import type { Bid, Listing } from "../types";

export interface PaymentMethod {
  id: string;
  label: string;
  /** Lines shown to the payer, e.g. account title and number. */
  details: { label: string; value: string }[];
}

export type PaymentOutcome =
  | { status: "paid" }
  | { status: "pending" }
  /** For hosted gateways (Safepay, JazzCash/Easypaisa merchant, Stripe): send the payer here. */
  | { status: "redirect"; url: string };

/**
 * Every way of collecting money implements this. v1 ships `test` and `manual`; gateways slot in
 * later by implementing `begin` (create a checkout session) and a webhook route that calls
 * store().setBidStatus(bidId, "paid" | "failed").
 */
export interface PaymentProvider {
  mode: string;
  /** Methods/instructions shown on the bid form before submitting. Empty for test mode. */
  methods(): PaymentMethod[];
  /** Whether the bidder must give a transaction reference or screenshot. */
  needsProof: boolean;
  /** Called once a pending bid row exists. */
  begin(bid: Bid, listing: Listing): Promise<PaymentOutcome>;
}

class TestProvider implements PaymentProvider {
  mode = "test";
  needsProof = false;
  methods() {
    return [];
  }
  async begin(): Promise<PaymentOutcome> {
    return { status: "paid" };
  }
}

class ManualProvider implements PaymentProvider {
  mode = "manual";
  needsProof = true;
  methods(): PaymentMethod[] {
    const env = process.env;
    const title = env.PAY_ACCOUNT_TITLE || env.PAY_BANK_TITLE || "Kapeta Pvt. Ltd.";
    const out: PaymentMethod[] = [];
    if (env.PAY_BANK_IBAN) {
      out.push({
        id: "bank",
        label: "Bank transfer",
        details: [
          { label: "Bank", value: env.PAY_BANK_NAME || "Bank" },
          { label: "Account title", value: env.PAY_BANK_TITLE || title },
          { label: "IBAN", value: env.PAY_BANK_IBAN },
        ],
      });
    }
    if (env.PAY_JAZZCASH) {
      out.push({ id: "jazzcash", label: "JazzCash", details: [{ label: "Account title", value: title }, { label: "Number", value: env.PAY_JAZZCASH }] });
    }
    if (env.PAY_EASYPAISA) {
      out.push({ id: "easypaisa", label: "Easypaisa", details: [{ label: "Account title", value: title }, { label: "Number", value: env.PAY_EASYPAISA }] });
    }
    if (out.length === 0) {
      out.push({ id: "bank", label: "Bank transfer", details: [{ label: "Details", value: "Payment details are not configured yet" }] });
    }
    return out;
  }
  async begin(): Promise<PaymentOutcome> {
    return { status: "pending" };
  }
}

export function paymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENTS_MODE || (process.env.NODE_ENV === "production" ? "manual" : "test");
  if (mode === "test") return new TestProvider();
  return new ManualProvider();
}
