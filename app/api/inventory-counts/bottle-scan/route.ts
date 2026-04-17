import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { logError } from '@/lib/logger'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT = `You are analyzing a photo of a liquor or beverage bottle to estimate how much liquid remains inside.

Look carefully at:
- The liquid level visible through the glass
- The overall fullness of the bottle
- The bottle shape (spirits bottles are typically narrower at the top)
- Any label or branding visible

Return ONLY a valid JSON object, no explanation, no markdown:
{
  "fill_percent": <number 0–100>,
  "confidence": "high" | "medium" | "low",
  "bottle_name": "<brand and spirit name if readable, or null>",
  "notes": "<one short sentence describing what you see>"
}

Rules:
- fill_percent 100 = completely full/sealed, 0 = empty
- Estimate to the nearest 5%
- A sealed, unopened bottle = 100
- If the liquid line is hard to see (dark glass, poor lighting, label blocking view), set confidence to "low"
- notes example: "Tito's vodka approximately 60% full"
- Do NOT output anything outside the JSON object`

export async function POST(req: NextRequest) {
  try {
    // Authentication required — this endpoint calls Claude Vision (billable)
    await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return NextResponse.json({ error: 'Image must be JPEG, PNG, or WebP' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: buffer.toString('base64') },
          },
          { type: 'text', text: PROMPT },
        ],
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected Claude response type')

    const text = content.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(text)

    return NextResponse.json({
      fill_percent: Math.max(0, Math.min(100, Math.round(Number(parsed.fill_percent) / 5) * 5)),
      confidence: parsed.confidence ?? 'medium',
      bottle_name: parsed.bottle_name ?? null,
      notes: parsed.notes ?? '',
    })
  } catch (e) {
    logError('bottle-scan', e)
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
  }
}
