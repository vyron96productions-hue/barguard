import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface CountInput {
  id: string
  name: string
  category: string | null
  unit: string
  expected: number
  actual: number
}

export async function POST(req: NextRequest) {
  try {
    await getAuthContext()
    const { counts } = await req.json() as { counts: CountInput[] }

    if (!Array.isArray(counts) || counts.length === 0) {
      return NextResponse.json({ findings: [], summary: null })
    }

    // Only flag items with meaningful gaps (>5% or ≥0.5 units)
    const discrepancies = counts.filter((c) => {
      if (c.expected <= 0) return false
      const gap = Math.abs(c.actual - c.expected)
      const pct = gap / c.expected
      return pct >= 0.05 || gap >= 0.5
    })

    if (discrepancies.length === 0) {
      return NextResponse.json({
        findings: [],
        summary: 'All counts are within expected range. No discrepancies to investigate.',
      })
    }

    const itemLines = discrepancies.map((c) => {
      const gap = c.actual - c.expected
      const pct = Math.round((Math.abs(gap) / c.expected) * 100)
      const direction = gap < 0 ? 'short' : 'over'
      return `- ID:${c.id} | ${c.name} (${c.category ?? 'uncategorized'}): expected ${c.expected} ${c.unit}, counted ${c.actual} — ${pct}% ${direction}`
    }).join('\n')

    const prompt = `You are a bar inventory loss detection expert. Analyze these inventory discrepancies and provide investigation guidance for a bar manager.

Items with discrepancies:
${itemLines}

For each item, provide 2-3 specific, actionable investigation reasons. Consider:
- Item category (spirits = high theft risk, beer = spillage/short-ship, wine = over-pouring)
- Whether the item is SHORT (loss) or OVER (counting/receiving error)
- Common causes: staff theft, over-pouring, unrecorded comps or free drinks, spillage/breakage, miscounting partial bottles, vendor short-shipping, incorrect previous count

Keep reasons concise (one sentence each). Be direct and practical.

Return ONLY valid JSON, no markdown fences:
{
  "findings": [
    {
      "id": "exact-id-from-input",
      "reasons": ["reason 1", "reason 2", "reason 3"]
    }
  ],
  "summary": "One plain-English sentence summarizing the overall situation and what the manager should prioritize."
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let parsed: { findings: Array<{ id: string; reasons: string[] }>; summary: string }
    try {
      parsed = JSON.parse(text)
    } catch {
      // Fallback if parse fails
      const fallback = discrepancies.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        expected: c.expected,
        actual: c.actual,
        unit: c.unit,
        gap: c.actual - c.expected,
        gapPercent: Math.round(((c.actual - c.expected) / c.expected) * 100),
        reasons: ['Review sales records for this period', 'Check for unrecorded comps or spillage'],
      }))
      return NextResponse.json({ findings: fallback, summary: 'Discrepancies found. Manual review recommended.' })
    }

    const reasonsMap = new Map(parsed.findings.map((f) => [f.id, f.reasons]))

    const findings = discrepancies.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      expected: c.expected,
      actual: c.actual,
      unit: c.unit,
      gap: c.actual - c.expected,
      gapPercent: Math.round(((c.actual - c.expected) / c.expected) * 100),
      reasons: reasonsMap.get(c.id) ?? ['Review sales and purchase records for this period'],
    }))

    return NextResponse.json({ findings, summary: parsed.summary })
  } catch (e) {
    return authErrorResponse(e)
  }
}
