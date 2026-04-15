# BarGuard — Agent Context

> Read this entire file before making any changes. These rules override general defaults.

## What This Is

BarGuard (`barguard.app`) is a bar inventory loss-detection SaaS. It tracks shrinkage, over-pouring, and stock discrepancies for bars and restaurants. Multi-tenant: each bar is one `businesses` row.

## Stack

- **Framework**: Next.js 15 App Router (TypeScript)
- **Styles**: Tailwind CSS v4
- **Database**: Supabase (Postgres + Auth + RLS + Storage)
- **AI**: Anthropic Claude SDK (`lib/ai.ts`)
- **Payments**: Stripe (checkout, webhooks, portal)
- **Email**: Resend (`support@barguard.app` for alerts)
- **Deployment**: Vercel (auto-deploys on GitHub push to main)
- **Domain**: `barguard.app`

## Running Locally

```bash
cd /mnt/i/workspace/barguard
npm run dev   # http://localhost:3000
```

Environment vars needed (already in `.env.local` — do NOT commit):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
`GMAIL_REFRESH_TOKEN`, `CRON_SECRET`

---

## Route Architecture

```
app/
  (auth)/         → login, signup, check-email, reset-password  [public]
  (app)/          → sidebar layout — all protected app pages
  (marketing)/    → public marketing pages
  blog/           → public blog
  partner/        → partner portal (separate auth role)
  admin/          → internal admin
  api/            → all API routes (private unless listed below)
```

### Middleware (`middleware.ts`)

Architecture is a **blocklist, not allowlist**. Any route not listed in `PRIVATE_APP_PREFIXES` is public by default — new marketing pages never need registration. Only new app pages need to be added to `PRIVATE_APP_PREFIXES`.

Public API routes are explicitly listed in `PUBLIC_API_PREFIXES`. All other `/api/*` routes are private.

Access gates (in order):
1. Auth check — redirect to `/login` if no session
2. Partner gate — partner users can only access `/partner/*`
3. Email verification gate — redirect to `/check-email`
4. Onboarding gate — redirect to `/profile?new=1` if `onboarding_complete !== true`
5. Subscription gate — trial / paid / grace period / expired checks; redirects to `/pricing`

---

## Authentication Pattern

**Always use `getAuthContext()` in API route handlers.** Never write auth logic inline.

```typescript
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { supabase, user, businessId, isOwner, clientRole } = await getAuthContext()
    // ... your logic
  } catch (e) {
    return authErrorResponse(e, '/api/your-route')
  }
}
```

`getAuthContext()` returns:
- `supabase` — server Supabase client (use for all DB queries)
- `user` — Supabase Auth user
- `businessId` — the bar's UUID (always filter all queries by this)
- `isOwner` — boolean, `role === 'owner'`
- `membershipRole` — `'owner' | 'member'`
- `clientRole` — `'employee' | 'manager' | 'admin'` (effective role, respects owner override)

**Never skip the `businessId` filter.** Every query on tenant data MUST include `.eq('business_id', businessId)`.

---

## Multi-Tenancy Rules

- Row-level security (RLS) is ON in Supabase. The server client respects it.
- Always filter by `businessId` even though RLS enforces it — belt-and-suspenders.
- `adminSupabase` (service role, bypasses RLS) — only for admin routes and cron jobs. Uses placeholder fallbacks at build time; do NOT call in regular user-facing routes.
- `purchase_import_draft_lines` has **no `business_id`** column — filter by joining through draft_id.
- `menu_item_recipes` has **no `business_id`** column — do not include in inserts.

---

## Key Library Files

| File | Purpose |
|---|---|
| `lib/auth.ts` | `getAuthContext()`, `authErrorResponse()` — use in every API route |
| `lib/conversions.ts` | `UNIT_TO_OZ`, `UNIT_LABELS`, `INVENTORY_BEVERAGE_UNITS`, `formatQty` — single source of truth for units |
| `lib/categories.ts` | `BEVERAGE_CATEGORIES`, `FOOD_CATEGORIES`, `PRESET_CATEGORIES` — single source of truth for categories |
| `lib/plans.ts` | `Plan` type, `PRICE_IDS`, `planHasFeature()` — use for feature gating |
| `lib/beer-packaging.ts` | `formatPackBreakdown()`, `normalizeUnitType()`, `PACKAGE_TYPE_SIZES` |
| `lib/calculations.ts` | Variance, cost, and loss calculation engine |
| `lib/logger.ts` | `logger.info/warn/error`, `logError` — use in all API routes, cron, POS sync |
| `lib/recipe-suggestions.ts` | Word-match algorithm for recipe suggestions; `RecipeSuggestion` type |
| `lib/ai.ts` | Anthropic Claude client — use this, do not instantiate your own |
| `lib/db.ts` | Shared DB helpers |
| `lib/errors.ts` | `AuthError` and other typed errors |
| `lib/plans.ts` | Feature flag checks by plan |
| `lib/sales-import/service.ts` | Shared service for writing confirmed sales to DB — used by CSV upload AND email import |

---

## Database Schema (Key Tables)

```
businesses          — id, contact_email, plan, stripe_customer_id, trial_ends_at,
                      stripe_subscription_id, payment_grace_ends_at
user_businesses     — user_id, business_id, role ('owner'|'member'), client_role,
                      membership_status ('active'|'removed')
inventory_items     — business_id, vendor_id, reorder_level, cost_per_unit,
                      item_type, pack_size, package_type
inventory_counts    — FK to inventory_items ON DELETE SET NULL
purchases           — FK to inventory_items ON DELETE SET NULL
purchase_import_drafts        — AI scan review staging
purchase_import_draft_lines   — no business_id; join via draft_id
inventory_item_aliases        — raw invoice names → inventory_item_id
menu_items          — business_id, name, price, item_type ('food'|'beer'|'drink')
menu_item_recipes   — NO business_id column; do not insert one
menu_item_aliases   — raw POS names → menu_item_id (auto-matching)
sales_transactions  — business_id, station, raw_item_name, menu_item_id (nullable)
expense_categories  — system (business_id NULL) + custom (business_id set)
expense_import_drafts + expense_import_draft_lines — OCR staging for non-inventory receipts
expense_receipts + expense_receipt_items           — confirmed expense records
expense_vendor_hints           — merchant → category memory
pos_connections     — POS credentials and OAuth tokens per business
email_import_rules  — trusted sender routing for email-to-import
sales_uploads       — traceability column for email imports
partners            — partner agency accounts
partner_users       — users linked to partner agencies
```

---

## Plans & Billing

| Plan | Price | Notes |
|---|---|---|
| `legacy` | Free | Always has full access — legacy free accounts |
| `basic` | $129/mo | Single user login |
| `pro` | $249/mo | Multi-user logins |
| `enterprise` | $449/mo | Full features |

Annual plans = 20% off. Price IDs are in `lib/plans.ts`.

- `planHasFeature(plan, 'pro')` — returns true if plan >= pro (or legacy)
- Use `<PlanGate requiredPlan="pro">` component to gate UI
- Stripe webhook at `barguard.app/api/stripe/webhook`
- Signup / payment failure / cancellation → Resend alert to `support@barguard.app`

---

## POS Integration Status

| Provider | Auth Type | Status | Notes |
|---|---|---|---|
| Square | OAuth | Built | Needs sandbox test |
| Clover | OAuth | Built | Needs sandbox test |
| Toast | Credentials | **LIVE** | Standard API, user creates creds in Toast Web |
| Focus POS | Credentials | **LIVE** | Basic Auth, no token expiry |
| Heartland | Credentials | Built | `comingSoon: true` |
| Lightspeed K-Series | OAuth | Built | `comingSoon: true` — awaiting dev approval |

---

## Units System

**`lib/conversions.ts` is the single source of truth.** Do not hardcode unit conversions anywhere else.

- All liquid units normalize to **ounces** for cost calculations
- `UNIT_TO_OZ` — total fluid oz per inventory unit
- `normalizeUnitType()` in `lib/beer-packaging.ts` — maps raw strings like `750ml` → `bottle`, `wine bottle` → `wine_bottle`
- `wine_bottle` = 750ml volume, poured in 5oz glasses (vs spirit `bottle` = 1.5oz shots) — same oz total, different pour size
- Keg units: `keg` (15.5gal), `quarterkeg`, `sixthkeg` — these are NOT in `WHOLE_UNITS`
- Food units tracked in native units (each, lb, oz, gallon, quart, etc.) — no oz conversion needed

**Cases+Loose system**: `isFoodCase`, `isFCP`, `isFoodWeightCase` are 3 separate code paths — update all three when adding new case-eligible units.

---

## AI / Claude Usage

- Use `lib/ai.ts` for all Anthropic calls — do not `new Anthropic()` inline
- Set `maxDuration = 120` on route handlers that call Claude (Vercel function timeout)
- Batch AI calls: max 50 items per call for categorization, 40 for recipe bootstrap
- Invoice scan: `max_tokens: 4096` (4096 prevents truncation on 20+ line invoices)
- Use `Promise.all` for parallel Claude calls — do not await sequentially

---

## Logging

Use `lib/logger.ts` everywhere. Never use `console.log` in production code.

```typescript
import { logger, logError } from '@/lib/logger'

logger.info('action', { businessId, itemCount: 5 })
logger.warn('slow-query', { ms: 450 })
logger.error('failed', { error: e })
logError(e, '/api/your-route')   // structured error log with stack
```

---

## Email Import (Cron)

- Gmail API polls `barguardllc@gmail.com` every 1 minute (Vercel Cron Pro plan)
- Cron route: `/api/email-imports/poll` — requires `CRON_SECRET` header
- Trusted sender routing via `email_import_rules` table
- Staged draft review at `/email-imports`
- Shared service at `lib/sales-import/service.ts` — do NOT duplicate this logic

---

## Blog

- Posts defined in `app/blog/posts/` or equivalent data file
- Hero images in `public/images/blogs/`, filename matches slug
- `Post` type has: `image`, `imageAlt`, `metaTitle`, `metaDescription`
- RSS feed at `barguard.app/blog/rss.xml`

---

## SEO Rules (Always Apply)

- Every page: unique `<title>` (50–60 chars), `metaDescription` (120–155 chars), canonical URL
- Title format: `Primary Keyword | BarGuard`
- OG tags required: `og:title`, `og:description`, `og:image` (1200×630px), `og:url`, `og:type`
- One H1 per page containing primary keyword
- All images use `next/image` with descriptive `alt` text, WebP format
- All internal links use `next/link` (no `target="_blank"`)
- External links: `rel="noopener noreferrer"`
- `sitemap.xml` must include all public pages
- Do NOT add `noindex` to public pages without explicit instruction

---

## What NOT to Do

- **Never skip `businessId` filter** on any tenant data query
- **Never use `console.log`** — use `lib/logger.ts`
- **Never instantiate `new Anthropic()`** — use `lib/ai.ts`
- **Never add `www` redirect in `next.config.ts`** — Vercel handles it; app-level rules cause redirect loops
- **Never add `noindex`** to public-facing pages without explicit instruction
- **Never commit `.env.local`** or any file with real secrets
- **Never write to `menu_item_recipes` with a `business_id` column** — it doesn't exist
- **Never write to `purchase_import_draft_lines` filtering by `business_id`** — it doesn't have one
- **Never hardcode unit conversions** — use `lib/conversions.ts`
- **Never hardcode category lists** — use `lib/categories.ts`
- **Never hardcode plan logic** — use `lib/plans.ts` and `planHasFeature()`
- **Never use `target="_blank"` without `rel="noopener noreferrer"`**
- **Do not add fake schema data** (fake reviews, ratings, dates)
- **Do not generate fake auth logic** — always use `getAuthContext()`

---

## Supabase Type Gotchas

Generated TS types don't auto-include new columns added via migration. When a new column exists in the DB but not in the generated types, use:

```typescript
const row = result as unknown as { new_column: string }
```

This is expected — do not regenerate types unless explicitly asked.

---

## Git & Deploy

- Push to `main` → Vercel auto-deploys to `barguard.app`
- DB migrations run manually in Supabase dashboard (SQL editor) — never auto-run
- Stripe webhooks are live — test locally with Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
