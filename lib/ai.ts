import Anthropic from '@anthropic-ai/sdk'
import type { InventoryUsageSummary, DrinkProfitSummary } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AiSummaryInput {
  periodStart: string
  periodEnd: string
  /** Shift label when a specific shift window was analyzed (e.g. "Dinner · Mon Mar 9 · 5:00 PM – 9:00 PM") */
  shiftLabel?: string | null
  /** Total gross revenue for the period/shift, null if no sales data */
  totalRevenue?: number | null
  /** Total guest / cover count for the period/shift, null if POS data unavailable */
  totalCovers?: number | null
  summaries: Pick<
    InventoryUsageSummary,
    | 'actual_usage'
    | 'expected_usage'
    | 'variance'
    | 'variance_percent'
    | 'status'
    | 'inventory_item'
  >[]
}

export async function generateVarianceSummary(input: AiSummaryInput): Promise<string> {
  const critical = input.summaries.filter((s) => s.status === 'critical')
  const warning  = input.summaries.filter((s) => s.status === 'warning')

  const structured = input.summaries.map((s) => ({
    item: s.inventory_item?.name ?? 'Unknown',
    unit: s.inventory_item?.unit ?? 'oz',
    expected_usage:  s.expected_usage.toFixed(2),
    actual_usage:    s.actual_usage.toFixed(2),
    variance:        s.variance.toFixed(2),
    variance_percent: s.variance_percent !== null ? `${s.variance_percent.toFixed(1)}%` : 'N/A',
    status: s.status,
  }))

  // ── Build shift / revenue context block ─────────────────────────────────────
  const hasRevenue = input.totalRevenue != null && input.totalRevenue > 0
  const hasCovers  = input.totalCovers  != null && input.totalCovers  > 0
  const avgSpend   = hasRevenue && hasCovers
    ? (input.totalRevenue! / input.totalCovers!).toFixed(2)
    : null

  const shiftContext = input.shiftLabel
    ? `\nShift analyzed: **${input.shiftLabel}**`
    : `\nPeriod: ${input.periodStart} to ${input.periodEnd}`

  const revenueContext = [
    hasRevenue ? `Total revenue: $${input.totalRevenue!.toFixed(2)}` : null,
    hasCovers  ? `Guests served: ${input.totalCovers}` : null,
    avgSpend   ? `Average spend per guest: $${avgSpend}` : null,
  ].filter(Boolean).join(' · ')

  // ── Prompt ──────────────────────────────────────────────────────────────────
  const shiftPerformanceSection = (hasRevenue || hasCovers)
    ? `\n## Shift Performance\nCommentary on revenue performance relative to inventory usage. ${avgSpend ? `With $${avgSpend} average spend per guest, comment on whether variance patterns suggest over-pouring or recipe mismatches that could erode margin.` : ''}\n`
    : ''

  const prompt = `You are an operational advisor for a bar or restaurant.
${shiftContext}
${revenueContext ? `Context: ${revenueContext}` : ''}
Usage quantities are in ounces for beverages, or in native units (each, lb, portion, etc.) for food items.
This data may include both beverage variance and kitchen/food ingredient variance.

Variance data:
${JSON.stringify(structured, null, 2)}

Critical items (>= 20% variance): ${critical.length}
Warning items (10–19% variance): ${warning.length}

Write a structured operational summary using EXACTLY these markdown sections in order.
Keep each section concise (2–4 sentences or bullet points). Professional, direct tone.
Do not repeat raw numbers excessively — focus on meaning and action.
Where relevant, distinguish between beverage loss and kitchen/food waste.

## Overall Assessment
One or two sentences describing the overall health of the period across both bar and kitchen.

## Critical Items
Call out the highest-risk items (drinks or food) and why they matter operationally. Short bullet list if multiple.

## Possible Causes
Brief list of likely root causes. For beverages: over-pouring, theft, measurement errors, recipe mismatches. For food: over-portioning, prep waste, untracked remakes, spoilage.

## Recommended Actions
2–4 practical, prioritized next steps for the owner or manager. Numbered list.
${shiftPerformanceSection}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected AI response type')
  return content.text
}

// ── Profit Intelligence AI ────────────────────────────────────────────────────

export interface ProfitInsightsInput {
  periodStart: string
  periodEnd:   string
  summaries:   Pick<
    DrinkProfitSummary,
    | 'quantity_sold'
    | 'gross_revenue'
    | 'estimated_cost'
    | 'estimated_profit'
    | 'profit_margin_pct'
    | 'has_full_cost'
    | 'menu_item'
  >[]
}

export async function generateProfitInsights(input: ProfitInsightsInput): Promise<string> {
  const totalRevenue = input.summaries.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const totalProfit  = input.summaries.reduce((s, r) => s + (r.estimated_profit ?? 0), 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null

  const rows = input.summaries.map((r) => ({
    drink:         r.menu_item?.name ?? 'Unknown',
    quantity_sold: r.quantity_sold,
    revenue:       `$${(r.gross_revenue ?? 0).toFixed(2)}`,
    est_cost:      r.estimated_cost != null ? `$${r.estimated_cost.toFixed(2)}` : 'N/A',
    est_profit:    r.estimated_profit != null ? `$${r.estimated_profit.toFixed(2)}` : 'N/A',
    margin:        r.profit_margin_pct != null ? `${r.profit_margin_pct.toFixed(1)}%` : 'N/A',
    full_cost_data: r.has_full_cost,
  }))

  const prompt = `You are a bar and restaurant profitability advisor reviewing menu-level performance data for a manager.
This data may include both drinks (cocktails, beer, shots) and food items (entrees, appetizers, sides, desserts).

Period: ${input.periodStart} to ${input.periodEnd}
Total revenue: $${totalRevenue.toFixed(2)}
Total estimated profit: $${totalProfit.toFixed(2)}
Average margin: ${avgMargin != null ? `${avgMargin.toFixed(1)}%` : 'N/A'}

Menu item performance data:
${JSON.stringify(rows, null, 2)}

Write a concise profit intelligence briefing using EXACTLY these sections. Each section: 2–4 lines max. Be specific — reference actual item names and numbers. No filler, no obvious advice.
Where relevant, distinguish between drink performance and food performance.

## What's Working
The 1–2 items (drink or food) delivering the best margin or profit. Why they matter to the bottom line.

## Watch List
The 1–2 items with weak margin, high cost, or volume that isn't converting to profit. Be specific about whether the issue is a food or beverage item.

## Opportunities
1–2 concrete actions to improve profit: pricing adjustments, recipe cost changes, promotion of high-margin items, or menu decisions. Prioritize by impact.

## Bottom Line
One sentence: the single most important thing this manager should focus on this week.`

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected AI response type')
  return content.text
}
