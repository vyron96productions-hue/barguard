import Anthropic from '@anthropic-ai/sdk'
import type { InventoryUsageSummary } from '@/types'

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
All usage quantities are in ounces unless otherwise stated.

Variance data:
${JSON.stringify(structured, null, 2)}

Critical items (>= 20% variance): ${critical.length}
Warning items (10–19% variance): ${warning.length}

Write a structured operational summary using EXACTLY these markdown sections in order.
Keep each section concise (2–4 sentences or bullet points). Professional, direct tone.
Do not repeat raw numbers excessively — focus on meaning and action.

## Overall Assessment
One or two sentences describing the overall health of the period.

## Critical Items
Call out the highest-risk items and why they matter operationally. Short bullet list if multiple.

## Possible Causes
Brief list of likely root causes (over-pouring, theft, measurement errors, recipe mismatches, etc.) based on the data.

## Recommended Actions
2–4 practical, prioritized next steps for the owner or manager. Numbered list.
${shiftPerformanceSection}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected AI response type')
  return content.text
}
