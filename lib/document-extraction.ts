import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedLineItem {
  raw_item_name: string
  quantity: number | null
  unit_type: string | null
  unit_cost: number | null
  line_total: number | null
  confidence: 'high' | 'medium' | 'low'
  package_type: string | null       // e.g. "6-pack", "12-pack", "case", "single", "keg"
  units_per_package: number | null  // individual units in each package, e.g. 6 for a 6-pack
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
      "confidence": "high" | "medium" | "low",
      "package_type": "single | 4-pack | 6-pack | 12-pack | 24-pack | case | keg or null",
      "units_per_package": number or null
    }
  ],
  "raw_text": "full verbatim text extracted from the document",
  "overall_confidence": "high" | "medium" | "low",
  "warning_message": "string describing any issues, or null if clean"
}

Rules:
- Only include actual product line items (spirits, beer, wine, mixers, bar supplies).
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- raw_item_name must be the product name exactly as printed on the document.
- unit_type: normalise to one of the listed options where possible; leave null if unclear.
- quantity: ALWAYS try to extract quantity. Look for numbers before product names, in quantity columns, or after "x" symbols. Do not leave null if a number is visible.
- package_type: detect from product names or descriptions. Common patterns to recognize:
  - "6 pk", "6pk", "6-pack", "six pack" → "6-pack", units_per_package: 6
  - "12 pk", "12pk", "12-pack", "twelve pack" → "12-pack", units_per_package: 12
  - "24 pk", "24pk", "24-pack", "twenty four pack" → "24-pack", units_per_package: 24
  - "case", "cs", "24 ct" → "case", units_per_package: 24
  - "keg", "half keg", "1/2 bbl" → "keg", units_per_package: 165
  - "single", "bottle", "bt", "btl", "can", "ea" → "single", units_per_package: 1
  - "4 pk", "4-pack" → "4-pack", units_per_package: 4
- units_per_package: the number of individual units in each package (e.g. 6 for a 6-pack). Null for spirits/wine where the unit IS the bottle.
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
        package_type: item.package_type ?? null,
        units_per_package: item.units_per_package ?? null,
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
