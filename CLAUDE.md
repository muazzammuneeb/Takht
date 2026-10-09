# Takht — build brief

Takht (takht.pk) is a pay-to-rank leaderboard for Pakistani businesses, inspired by outbid.lol.
"Takht" means throne. Anyone can list a business; to take a rank you pay Rs 1 more than the
business currently holding it. Totals accumulate and never reset. The point for businesses is
cheap visibility and bragging rights ("we're #1 on Takht"), so shareable images matter as much
as the website.

Owner: Moz (solo founder, experienced engineer). Business entity: Kapeta Pvt. Ltd. (Pakistan).

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel.
- Supabase (Postgres) for data. Keep all DB access behind `src/lib/db/*` functions so the
  store can be swapped; use a local seed for development.
- Plain CSS with design tokens (CSS variables) — no UI kit needed.
- Fonts via `next/font/google` or `@fontsource/*` (self-hosted, so image export can embed them):
  Cinzel, Manrope, Anton, Archivo, Schibsted Grotesk, Noto Nastaliq Urdu.
- Timezone for everything date-based: Asia/Karachi (PKT).
- Currency: PKR, shown as `Rs 48,500` (thousands separators, no decimals).

## Core mechanics

- **Listing:** name, slug, website URL, category, city, one-line tagline, logo (optional, falls
  back to initials), status (`pending` | `live` | `rejected`), created_at.
- **Bid:** listing_id, amount (PKR integer), status (`pending` | `paid` | `failed`), created_at,
  payment_ref.
- **Total** of a listing = sum of its `paid` bids.
- **All-time board:** live listings ordered by total desc; ties go to whoever reached that total
  first (earliest last-paid-bid time).
- **Today board:** sum of paid bids made today in PKT, same ordering; resets at midnight PKT.
- **Taking a rank:** to take rank N, a listing must pay `holder_total(N) + 1 - own_total`.
  The listing page offers "Take #1 for Rs X", "Take #N for Rs Y" for every higher rank, and a
  custom amount.
- **Minimum bid:** Rs 100.
- **Categories:** Food, Fashion, Tech, Startups, Services, Health & Fitness, Education, Ecommerce,
  Local, Other. City is free text with suggestions (Karachi, Lahore, Islamabad, Rawalpindi,
  Faisalabad, Multan, Peshawar, Quetta, Hyderabad, Overseas).
- Category and city filters on both boards.

## Pages

1. `/` — All-time board. Header with Takht wordmark; a prominent "Claim #1 for Rs X" box;
   tabs All-time / Today; category and city filters; ranked list (rank, logo/initials, name,
   tagline, category · city, total, "take this rank for Rs X" link).
2. `/today` — Today board (same layout).
3. `/l/[slug]` — Listing page: current rank (all-time and today), total, take-a-rank options,
   bid history (amounts and dates), visit-website link (with `?utm_source=takht`),
   and the **Share your rank** section (below).
4. `/add` — Add a listing + first bid (≥ Rs 100) in one flow. The listing is `pending` until
   approved in admin; it goes live with its paid total.
5. `/rules` — How it works, refunds (none), moderation rules, contact.
6. `/admin` — Protected (simple password via env var to start). Sections:
   - **Pending listings:** approve / reject.
   - **Payments:** pending manual payments to mark paid / failed.
   - **Today's Post:** the daily social images and captions (below).

## Payments

- **v1: manual mode.** The bid form shows payment instructions (bank transfer / JazzCash /
  Easypaisa details from env/config) and collects a reference or screenshot upload; the bid is
  `pending` until marked paid in admin. A `PAYMENTS_MODE=test` setting marks bids paid instantly
  for development.
- **Later:** a gateway (Safepay or JazzCash/Easypaisa merchant APIs) for PKR, and Stripe via a UK
  entity for overseas bidders. Build a `PaymentProvider` interface now so these slot in.

## Moderation

Listings are approved before going live. Reject politics, gambling, adult, scams, crypto
"pump" coins, and anything illegal in Pakistan. Admin can hide a listing at any time.

## Share your rank cards (key growth feature)

On each listing page, a 1080×1080 card the business downloads and reposts. Three styles,
the business can switch; the default depends on category:

- Food, Fashion, Local → **Truck Art**
- Tech, Startups → **Minimal**
- Everything else → **Darbar**

Card content: logo or initials badge, business name, big rank ("#1"), scope ("in Food · Karachi"
or "in Tech · Pakistan"), date, `takht.pk`. **Never show the amount paid** on share cards.
Rank 1 label: "Now sitting on the Takht"; other ranks: "Ranked on the Takht board".

## Today's Post (admin)

Daily images for Takht's own social accounts, shown on `/admin` with a **Download** button per
image and a **Copy caption** button per platform:

- **Darbar wide 1200×675** for X and LinkedIn: #1 hero + ranks 2–7.
- **Truck Art square 1080×1080** for Instagram: #1 hero + ranks 2–9.
- **"New King" alert** (Truck Art square) whenever #1 changes hands.
- Captions: a template per platform (X short, LinkedIn slightly longer, Instagram with hashtags),
  naming the #1 and any big movers.
- Later: email Moz at 9pm PKT with a link to this page (Vercel Cron + an email provider), and an
  optional switch to auto-post via Publer's API.

## Image rendering

Build every card and post as a normal React component rendered on its own route
(e.g. `/render/card/[slug]?style=truck`, `/render/post/darbar-wide`) at exact pixel size.
For v1, export to PNG client-side with `html-to-image` using self-hosted fonts. Check that Urdu
Nastaliq renders correctly in the PNG; if it doesn't, render the Urdu lines as pre-made SVG
images. (`@vercel/og`/Satori does not shape Nastaliq properly — avoid it for Urdu text.)

## Design tokens

Approved template designs exist on Moz's Claude canvas "Takht Post Templates"; match these specs.

**Darbar (master brand: site, LinkedIn/X post)**
- Ground `#0B2F25` (deep emerald), surface `#0E3A2E`, gold `#D4A84B`, text `#F3EBD8`,
  muted `#C9BE9F`, bright text `#FBF6EA`.
- Cinzel (700/900) for wordmark, ranks and names; Manrope for body; Noto Nastaliq Urdu for Urdu
  (needs line-height ≈ 1.7–1.9).
- Double hairline gold frame inset 28px and 38px (60% and 25% opacity); gold hairline dividers;
  crown mark (simple stroked crown, 3 peaks).
- Urdu touches: تخت, آج کا بادشاہ (Aaj ka Badshah), تخت پہ کون؟ (Takht pe kaun?), مبارک ہو.

**Truck Art (Instagram, New King alerts, Food/Fashion/Local share cards)**
- Ground `#14204A` navy, band `#0C1533`, marigold `#F2A900`, pink `#FF6FA5`, teal `#3FD0C0`,
  row surface `#1D2C61`; rank chips cycle `#C21E5B` / `#0B7A71` (white text) and marigold
  (navy text).
- Anton for display (uppercase), Archivo for body.
- Rows of rotated-square diamonds top and bottom (marigold/pink/teal/white), rounded marigold
  hero block with a navy + pink double ring, white `takht.pk` pill. Urdu: شاباش on share cards.

**Minimal (Tech/Startups share cards)**
- Ground `#FAFAF7`, ink `#101012`, muted `#5B5B60`, rule `#D9D8D2`, accent `#0A6B3B`
  (green; allow blue `#1F4FD1` per brand).
- Schibsted Grotesk; huge rank (≈360px, weight 800, tight tracking) with an accent dot; dark
  rounded-square initials badge; footer rule with small crown + TAKHT + takht.pk.

**Site UI:** Darbar tokens; mobile-first (most traffic will be phones); touch targets ≥ 44px;
text contrast ≥ 4.5:1.

## Build order

1. Scaffold, tokens, fonts, DB schema + seed (10 sample listings with bids).
2. Boards (`/`, `/today`) with filters, and the rank-price calculation (unit-tested).
3. Listing page + take-a-rank flow (test payments mode).
4. `/add` + admin approval.
5. Share cards (3 styles) + PNG download.
6. Admin Today's Post (2 images + New King + captions).
7. Manual payment mode + admin payments queue.
8. Deploy to Vercel; connect takht.pk (registered via domain.pk) and a .com redirect.

## Done means

- Rank-price maths covered by tests (ties, first bid, taking #1, today vs all-time, PKT midnight).
- Every page works at 375px width.
- Share card and post PNGs match the specs above, including Urdu text.
- No amounts on share cards; amounts are shown on the boards.
