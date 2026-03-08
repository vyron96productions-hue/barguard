# BarGuard — Liquor Loss Detector

Detect liquor shrinkage, over-pouring, and inventory discrepancies using the reports your bar already has.

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run `supabase/schema.sql` to create all tables
3. Run `supabase/seed.sql` to load demo data (The Rusty Tap)

### 2. Configure environment variables

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Supabase URL and anon key from: Project Settings → API.
Get your Anthropic API key from: console.anthropic.com.

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

---

## How It Works

### Workflow

1. **Add Inventory Items** — the physical bottles you track (e.g. Tito's Vodka, tracked in oz)
2. **Add Menu Items & Recipes** — what you sell and how much of each ingredient each drink uses
3. **Upload CSVs** — sales, inventory counts, and purchases
4. **Resolve Aliases** — map CSV names that don't match your item names
5. **Run Calculations** — set a date range on the dashboard and click Run Calculations
6. **Generate AI Summary** — get a plain-English breakdown of your biggest issues

### Variance Calculation

```
expected_usage = sum(quantity_sold x recipe_oz) across all menu items in period
actual_usage   = beginning_inventory + purchased - ending_inventory
variance       = actual_usage - expected_usage
```

- Normal: variance < 10%
- Warning: variance 10-19%
- Critical: variance >= 20%

Positive variance = more was consumed than expected (loss, over-pouring, theft).

### CSV Formats

Sales CSV (required: date, item_name, quantity_sold)
```
date,item_name,quantity_sold,gross_sales
2024-03-01,Vodka Soda,12,84.00
```

Inventory Count CSV (required: count_date, item_name, quantity_on_hand)
```
count_date,item_name,quantity_on_hand,unit_type
2024-03-01,Tito's Vodka,48.5,oz
```

Purchase CSV (required: purchase_date, item_name, quantity_purchased)
```
purchase_date,item_name,quantity_purchased,vendor_name,unit_cost
2024-03-05,Tito's Vodka,1,Southern Glazer's,22.50
```

Column headers don't have to match — the upload flow lets you map your CSV columns to required fields.

### Alias Resolution

If your POS exports "Vodka Soda (house)" but your menu item is "Vodka Soda", go to Alias Resolution to map the raw name. Mappings are saved and auto-applied on future imports.

---

## Deployment

```bash
npx vercel
```

Add environment variables in Vercel → Project Settings → Environment Variables.

---

## Tech Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres)
- Anthropic Claude (AI summaries only — all calculations are deterministic)
