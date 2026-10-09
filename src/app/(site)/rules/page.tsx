import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, MIN_BID } from "@/lib/config";
import { formatPKR } from "@/lib/format";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <article className="prose">
      <h1>How Takht works</h1>
      <p className="urdu" lang="ur" style={{ color: "var(--d-gold)", fontSize: 22, textAlign: "left" }}>
        تخت پہ کون؟
      </p>
      <ol>
        <li>List your business and place a bid of at least {formatPKR(MIN_BID)}.</li>
        <li>Your total is the sum of all your paid bids. Totals add up forever and never reset.</li>
        <li>
          The board ranks businesses by total. To take a rank, pay {formatPKR(1)} more than the business holding it, minus
          what you already have. If two businesses have the same total, whoever got there first stays ahead.
        </li>
        <li>
          The <Link href="/today">Today</Link> board only counts bids paid today, Pakistan time. It resets at midnight PKT.
        </li>
        <li>Download your share card from your listing page and tell the world you sit on the Takht.</li>
      </ol>

      <h2>Payments and refunds</h2>
      <p>
        Bids are paid by bank transfer, JazzCash or Easypaisa. A bid counts once we confirm the payment. All amounts are in
        Pakistani rupees.
      </p>
      <p>
        <strong>Payments are not refundable.</strong> A bid buys a place on the board at that moment; someone may outbid you
        a minute later. That is the game.
      </p>

      <h2>Moderation</h2>
      <p>Every listing is reviewed before it goes live. We reject or remove:</p>
      <ul>
        <li>Political parties, candidates and political campaigns</li>
        <li>Gambling, betting and lotteries</li>
        <li>Adult content and services</li>
        <li>Scams, pyramid schemes and &quot;guaranteed returns&quot;</li>
        <li>Crypto &quot;pump&quot; coins and token sales</li>
        <li>Anything illegal in Pakistan, or hateful, misleading or impersonating another business</li>
      </ul>
      <p>We can hide a listing at any time if it breaks these rules. Bids on removed listings are not refunded.</p>

      <h2>Contact</h2>
      <p>
        Takht is run by Kapeta Pvt. Ltd. Questions, reports or big bids: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </article>
  );
}
