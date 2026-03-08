import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedLineItem {
  raw_item_name: string
  quantity: number | null
  unit_type: string | null
  unit_cost: number | null
  line_total: number | null
  confidence: 'high' | 'medium' | 'low'
}

export interface ParsedPurchaseDocument {
  vendor_name: string | null
  purchase_date: string | null // YYYY-MM-DD
  line_items: ParsedLineItem[]
  raw_text: string
  overall_confidence: 'high' | 'medium' | 'low'
  warning_message: string | null
}

const EXTRACTION_PROMPT = `You are an expert at reading purchase receipts, invoices, and delivery orders for a bar or restaurant.

Extract all purchase information from this document and return ONLY a valid JSON object (no markdown fences, no explanation text).

Required JSON shape:
{
  "vendor_name": "string or null",
  "purchase_date": "YYYY-MM-DD or null",
  "line_items": [
    {
      "raw_item_name": "exact product name as written on the document",
      "quantity": number or null,
      "unit_type": "bottle | case | keg | oz | ml | l | pint | sixthkeg | quarterkeg | halfkeg or null",
      "unit_cost": number or null,
      "line_total": number or null,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "raw_text": "full verbatim text extracted from the document",
  "overall_confidence": "high" | "medium" | "low",
  "warning_message": "string describing any issues, or null if clean"
}

Rules:
- Only include actual product line items (spirits, beer, wine, mixers, bar supplies).
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- raw_item_name must be the product name exactly as printed.
- unit_type: normalise to one of the listed options where possible; leave null if unclear.
- Set item confidence to "low" if the quantity, name, or price is unclear or partially obscured.
- Set overall_confidence to "low" if the document is blurry, incomplete, or hard to read.
- raw_text must contain ALL text visible in the document.
- Do NOT output anything outside the JSON object.`

function parseResponse(text: string): ParsedPurchaseDocument {
  const stripped = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  try {
    const parsed = JSON.parse(stripped)
    return {
      vendor_name: parsed.vendor_name ?? null,
      purchase_date: parsed.purchase_date ?? null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items.map((item: ParsedLineItem) => ({
        raw_item_name: item.raw_item_name ?? 'Unknown item',
        quantity: item.quantity ?? null,
        unit_type: item.unit_type ?? null,
        unit_cost: item.unit_cost ?? null,
        line_total: item.line_total ?? null,
        confidence: item.confidence ?? 'medium',
      })) : [],
      raw_text: parsed.raw_text ?? stripped,
      overall_confidence: parsed.overall_confidence ?? 'medium',
      warning_message: parsed.warning_message ?? null,
    }
  } catch {
    return {
      vendor_name: null,
      purchase_date: null,
      line_items: [],
      raw_text: text,
      overall_confidence: 'low',
      warning_message: 'Could not parse extracted data. Please review the raw text and enter details manually.',
    }
  }
}

export async function extractFromImage(
  imageBuffer: Buffer,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<ParsedPurchaseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBuffer.toString('base64'),
            },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}

export async function extractFromPdf(pdfBuffer: Buffer): Promise<ParsedPurchaseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBuffer.toString('base64'),
            },
          } as any,
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}
