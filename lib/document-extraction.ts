import Anthropic from '@anthropic-ai/sdk'
import { extractPackagingFromName, normalizeUnitType, PACKAGE_TYPE_SIZES } from './beer-packaging'

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
      "unit_type": "bottle | beer_bottle | can | case | keg | pint | 1L | 1.75L | sixthkeg | quarterkeg | halfkeg or null",
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
- ONE line item per physical line on the invoice. NEVER split a single invoice line into multiple entries.
- Only include actual product line items (spirits, beer, wine, mixers, bar supplies).
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- raw_item_name must be the product name exactly as printed on the document (keep the full name including any pack size, e.g. "Budweiser 12 Pack", "Corona 6pk").
- unit_type: normalise to one of the listed options where possible; leave null if unclear. IMPORTANT unit_type rules:
  - For beer in CANS (Modelo, Budweiser, Coors, White Claw, truly, etc.): use "can" for individual cans, "case" only when the invoice explicitly shows a case purchase (e.g. "5 CS", "2 cases").
  - For beer in BOTTLES (Corona, Heineken, Corona Extra, Stella Artois, etc.): use "beer_bottle" for individual bottles.
  - When unsure if a beer product is a can or bottle, default to "can".
  - For spirits (vodka, tequila, rum, whiskey, gin, etc.): use "bottle" for standard 750ml, "1L" for 1-liter bottles, "1.75L" for handles.
  - Never guess "case" when the unit is ambiguous — default to "can" for beer, "bottle" for spirits.
- quantity: ALWAYS try to extract quantity. This is the NUMBER OF PACKAGES ordered (the value in the QTY column). If an invoice shows "2  Bud Light 24pk", quantity is 2 (not 24). If it shows "1  Corona 6-pack", quantity is 1. Look for numbers in the quantity column, before product names, or after "x" symbols. Do not leave null if a number is visible.
- package_type: detect from the product name or description. Common patterns:
  - "6 pk", "6pk", "6-pack", "six pack" → "6-pack", units_per_package: 6
  - "12 pk", "12pk", "12-pack", "twelve pack" → "12-pack", units_per_package: 12
  - "24 pk", "24pk", "24-pack", "twenty four pack" → "24-pack", units_per_package: 24
  - "case", "cs", "24 ct" → "case", units_per_package: 24
  - "keg", "half keg", "1/2 bbl" → "keg", units_per_package: 165
  - "single", "bottle", "bt", "btl", "can", "ea" → "single", units_per_package: 1
  - "4 pk", "4-pack" → "4-pack", units_per_package: 4
- units_per_package: the number of individual cans/bottles inside each package. Examples: 24-pack → 24, 6-pack → 6, case → 24, keg → 165, single bottle → 1. ALWAYS set this when package_type is detected. Null only for spirits/wine sold as individual bottles with no pack size in the name.
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
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items.map((item: ParsedLineItem) => {
        // Normalize unit_type if present
        const rawUnit = item.unit_type ?? null
        const normalizedUnit = rawUnit ? normalizeUnitType(rawUnit) : null

        // If AI didn't detect package info, try extracting it from the item name
        let packageType = item.package_type ?? normalizedUnit?.packageType ?? null
        let unitsPerPackage = item.units_per_package ?? normalizedUnit?.unitsPerPackage ?? null

        // Always try name-based extraction when unitsPerPackage is still missing —
        // the AI often sets package_type without filling in units_per_package
        if (!unitsPerPackage || unitsPerPackage <= 0) {
          const fromName = extractPackagingFromName(item.raw_item_name ?? '')
          if (fromName.packageType) {
            packageType = packageType ?? fromName.packageType
            unitsPerPackage = fromName.unitsPerPackage
          }
        }
        // Last resort: derive units_per_package from packageType alone
        if ((!unitsPerPackage || unitsPerPackage <= 0) && packageType) {
          const size = PACKAGE_TYPE_SIZES[packageType as keyof typeof PACKAGE_TYPE_SIZES]
          if (size) unitsPerPackage = size
        }

        return {
          raw_item_name: item.raw_item_name ?? 'Unknown item',
          quantity: item.quantity ?? null,
          unit_type: normalizedUnit?.unit ?? rawUnit,
          unit_cost: item.unit_cost ?? null,
          line_total: item.line_total ?? null,
          confidence: item.confidence ?? 'medium',
          package_type: packageType,
          units_per_package: unitsPerPackage,
        }
      }) : [],
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
