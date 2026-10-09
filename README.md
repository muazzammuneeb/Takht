# Takht

Takht (takht.pk) is a pay-to-rank leaderboard for Pakistani businesses. See `CLAUDE.md` for the full brief.

## Run locally

```bash
npm install
cp .env.example .env.local   # PAYMENTS_MODE=test, ADMIN_PASSWORD=…
npm run dev                  # http://localhost:3000
npm test                     # rank-price maths (vitest)
```

With no Supabase variables set, data lives in `.data/takht.json`. That file is seeded on first run with
10 live listings, one pending listing and two pending payments. Delete `.data/` to reseed.

## Structure

| Path | What |
| --- | --- |
| `src/lib/ranking.ts` | All ranking and pricing maths (pure, tested in `ranking.test.ts`) |
| `src/lib/time.ts` | PKT (UTC+5) day boundaries and date formatting |
| `src/lib/db/*` | The only DB access. `Store` interface, with `LocalStore` (JSON) and `SupabaseStore` |
| `src/lib/payments` | `PaymentProvider` interface, with `test` and `manual` providers |
| `src/app/actions.ts` | Server actions: place bid, add listing, admin actions |
| `src/components/cards/*` | Share cards (Darbar, Truck Art, Minimal) and posts (Darbar wide, Truck square, New King) |
| `src/app/render/*` | Each artboard at its exact pixel size: `/render/card/[slug]?style=truck&scope=category`, `/render/post/darbar-wide` (also `truck-square`, `new-king`) |

## Rules implemented

- **Total:** the sum of a listing's `paid` bids. A bid counts from `paid_at`, the moment it was marked paid; in test mode that is immediate.
- **Ties:** the listing that reached the total first ranks higher (earliest latest-paid-bid time).
- **Today board:** counts bids paid since midnight PKT.
- **Price to take rank N:** `max(100, holder_total(N) + 1 − own_total)`.
- **Share cards:** never show amounts. Boards and Takht's own daily posts do.

## Supabase

1. Create a project. Run `supabase/migrations/0001_init.sql`, which creates the tables and the private `takht` storage bucket.
2. Optional: load dev data with `node scripts/gen-seed-sql.mjs > supabase/seed.sql`, then run that file.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. They are only used server-side.

## Deploy (Vercel)

1. Import the repo into Vercel (framework: Next.js).
2. Set these env vars:
   - Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Payments: `PAYMENTS_MODE=manual`, plus `PAY_BANK_NAME`, `PAY_BANK_TITLE`, `PAY_BANK_IBAN`, `PAY_JAZZCASH`, `PAY_EASYPAISA`, `PAY_ACCOUNT_TITLE`
   - Admin and site: `ADMIN_PASSWORD`, `ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL=https://takht.pk`, `CONTACT_EMAIL`

   Without Supabase on Vercel, the app falls back to `/tmp`, which is wiped between invocations. Use that for previews only.
3. Domains: add `takht.pk` in Vercel → Domains. At domain.pk, point an `A` record for `@` to Vercel's IP and a `CNAME` for `www` to `cname.vercel-dns.com` (use the values Vercel shows). Add `takht.com` as well and set it to redirect (308) to `takht.pk`.

## Later

- Payment gateways (Safepay, JazzCash/Easypaisa merchant APIs, Stripe): implement `PaymentProvider.begin` to return `{ status: "redirect", url }`, and add a webhook route that calls `store().setBidStatus(id, "paid")`.
- A 9pm PKT email linking to `/admin#todays-post`: Vercel Cron at `0 16 * * *` UTC, plus an email provider.
- Auto-posting through Publer's API.
