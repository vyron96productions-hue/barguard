# inventory-calc.ts Migration Tracker

## Phase

**Current**: Shadow comparison running on `stock-levels`. Old logic still active everywhere.

---

## Routes & Status

| Route | Status | Notes |
|---|---|---|
| `GET /api/stock-levels` | **SHADOW** | Old calc returned; new calc runs in parallel and logs diffs |
| `GET /api/inventory/expected-on-hand` | Not started | New calc was modeled after this route — expect zero diffs |
| `GET /api/reorder-alerts` | Not started | Has `>` boundary bug (should be `>=`) + food purchase bug — expect diffs |
| `GET /api/reorder-suggestions` | Not started | Uses different data window (30 days, not since last count) — partial migration |

---

## How to Read the Shadow Logs

Every time `GET /api/stock-levels` is called, Vercel logs will contain one of:

```
[stock-levels:shadow] ✓ new calc matches old for all N estimated items
```
→ Zero diffs. Safe to proceed with migration.

```
[stock-levels:shadow] DIFF item=<uuid> name=<name> unit=<unit> old=X new=Y delta=Z
[stock-levels:shadow] N item(s) differ — see warnings above
```
→ Diffs exist. Investigate which items and why before migrating.

---

## Expected Diffs and Their Meaning

### 1. Food items with non-oz units + purchases after last count

**Affected units**: `each`, `portion`, `slice` (anything not in `UNIT_TO_OZ`)

**Root cause**: Old `stock-levels` and `reorder-alerts` have a bug in the non-oz path:
```typescript
// OLD (buggy): ignores purchasedOz
estimated_qty = Math.max(0, count.quantity_on_hand - nativeUsed)

// NEW (correct): includes purchases
estimated_qty = convertFromOz(baseOz + purchasesOz - deductionsOz, unit)
// convertToOz/convertFromOz pass through unchanged for non-oz units, so this equals:
//   count.quantity_on_hand + purchased - nativeUsed
```

**Impact**: Items with unit='each' (e.g. citrus, garnishes) that have received
deliveries since their last count will show **higher** estimated stock in the new calc.
This is **a bug fix, not a regression**.

**Decision needed**: Verify with the bar owner that the new (higher) estimate is correct
before migrating.

### 2. Boundary difference in `reorder-alerts`

**Root cause**: `reorder-alerts` uses `date > count.count_date` (exclusive) while
the new calc uses `>=` (inclusive). Items counted and sold on the same day will show
a tiny difference.

**Impact**: Very small — sales on the exact count date (same YYYY-MM-DD string).
In practice, counts are done before the bar opens so this rarely matters.

---

## Migration Procedure (one route at a time)

### Step 1: Validate stock-levels shadow
Deploy current code. Check Vercel logs after a few stock-page loads.
- Zero diffs → proceed to Step 2
- Diffs only on `each`/non-oz food items with purchases → expected bug fix, decide to accept or investigate
- Unexpected diffs on liquid (oz, bottle, etc.) items → stop, investigate

### Step 2: Migrate expected-on-hand

Replace the route's internal logic with `calculateExpectedOnHand`:

```typescript
import { calculateExpectedOnHand, earliestCountDate } from '@/lib/inventory-calc'

// After fetching items, counts, purchases, sales, recipes:
const calc = calculateExpectedOnHand(items, counts, purchases, sales, recipes)

const result: ExpectedOnHandItem[] = items
  .filter((item) => calc.get(item.id)?.has_estimate)
  .map((item) => {
    const c = calc.get(item.id)!
    return {
      id:   item.id,
      name: item.name,
      unit: item.unit,
      expected_qty:        c.estimated_qty!,
      expected_qty_oz:     c.estimated_qty_oz!,
      last_count_qty:      c.last_count_qty,
      last_count_date:     c.last_count_date,
      purchases_since_oz:  c.purchases_since_oz,
      deductions_since_oz: c.deductions_since_oz,
    }
  })
```

Remove old `convertToOz`/`convertFromOz` imports and internal calc logic.

### Step 3: Migrate reorder-alerts

Replace `estimateQty()` helper with `calculateExpectedOnHand`. The `has_estimate`
field replaces the `count != null` check. The filter for `estimated_qty <= reorder_level`
uses `c.estimated_qty ?? 0`.

Note: the `>` → `>=` boundary change is intentional and will fix the minor date-boundary bug.

### Step 4: Migrate reorder-suggestions

This route uses a 30-day window for daily-usage calculation, not a since-last-count window.
It still needs the since-last-count stock estimate for `current_stock`. Extract only the
stock estimate from `calculateExpectedOnHand` and keep the 30-day sales window for
`avg_daily_usage` separately.

### Step 5: Remove old code

Once all four routes have been migrated and validated in production:
1. Remove the shadow comparison block from `stock-levels`
2. Remove `UNIT_TO_OZ` import from `stock-levels` (no longer used in calc)
3. Remove `convertToOz`/`convertFromOz` from routes that no longer use them directly
4. Delete this migration file
