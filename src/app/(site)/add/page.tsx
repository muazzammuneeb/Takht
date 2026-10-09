import type { Metadata } from "next";
import { AddForm } from "@/components/AddForm";
import { bidScopes, paymentProps } from "@/lib/bidProps";
import { CATEGORIES, CITIES } from "@/lib/config";
import { snapshot } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "List your business" };

export default async function AddPage({ searchParams }: { searchParams: Promise<{ amount?: string; board?: string }> }) {
  const sp = await searchParams;
  const snap = await snapshot();
  const amount = Number(sp.amount);
  return (
    <>
      <h1>List your business</h1>
      <p className="muted">
        Add your business and place your first bid. We review every listing before it goes live, usually within a day.
      </p>
      <AddForm
        categories={CATEGORIES}
        cities={CITIES}
        bid={{
          scopes: bidScopes(snap, null),
          ...paymentProps(),
          initialAmount: Number.isInteger(amount) && amount > 0 ? amount : undefined,
          initialScope: sp.board === "today" ? "today" : "all",
        }}
      />
    </>
  );
}
