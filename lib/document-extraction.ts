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

export type ScanType = 'liquor' | 'food' | 'supplies'

const JSON_SHAPE = `{
  "vendor_name": "string or null",
  "purchase_date": "YYYY-MM-DD or null",
  "line_items": [
    {
      "raw_item_name": "exact product name as written on the document",
      "quantity": number or null,
      "unit_type": "see rules below",
      "unit_cost": number or null,
      "line_total": number or null,
      "confidence": "high" | "medium" | "low",
      "package_type": null,
      "units_per_package": null
    }
  ],
  "raw_text": "full verbatim text extracted from the document",
  "overall_confidence": "high" | "medium" | "low",
  "warning_message": "string describing any issues, or null if clean"
}`

const COMMON_RULES = `
- ONE line item per physical line on the invoice. NEVER split a single invoice line into multiple entries.
- raw_item_name must be the product name exactly as printed on the document.
- quantity: ALWAYS try to extract it. It is the number in the QTY column, or the number before the product name. Do not leave null if a number is visible.
- unit_cost and line_total: extract the dollar amounts as plain numbers (no $ sign).
- Set item confidence to "low" if the quantity, name, or price is unclear or partially obscured.
- Set overall_confidence to "low" if the document is blurry, incomplete, or hard to read.
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- raw_text must contain ALL text visible in the document.
- Do NOT output anything outside the JSON object.`

const LIQUOR_PROMPT = `You are an expert at reading purchase receipts and invoices for a bar or restaurant — specifically for LIQUOR, BEER, and WINE orders.

Extract all purchase information from this document and return ONLY a valid JSON object (no markdown fences, no explanation text).

Required JSON shape:
${JSON_SHAPE.replace('"unit_type": "see rules below"', '"unit_type": "bottle | beer_bottle | beer_bottle_16oz | can | case | keg | pint | 1L | 1.75L | wine_bottle | sixthkeg | quarterkeg or null"')}

Rules:
- Only include actual beverage line items (spirits, beer, wine, mixers, non-alcoholic beverages).
- unit_type rules:
  - Beer cans (Modelo, Budweiser, Coors, White Claw, Truly, etc.): use "can" for individual cans, "case" only when the invoice explicitly says "CS" or "case".
  - Beer bottles (Corona, Heineken, Stella Artois, etc.): use "beer_bottle" for 12oz bottles, "beer_bottle_16oz" for pints/tallboys.
  - When unsure if a beer is a can or bottle, default to "can".
  - Spirits (vodka, tequila, rum, whiskey, gin, etc.): "bottle" for 750ml, "1L" for 1-liter, "1.75L" for handles.
  - Wine: "wine_bottle" for standard 750ml wine bottles.
  - Kegs: "keg" for half-barrel, "quarterkeg" for quarter-barrel, "sixthkeg" for sixth-barrel.
  - Never guess "case" when the unit is ambiguous.
- package_type: detect from the product name ("6pk" → "6-pack", "24pk" → "24-pack", "CS" → "case", "keg" → "keg"). Set units_per_package accordingly (6-pack → 6, 24-pack → 24, case → 24, keg → 165). Set both to null for single bottles/cans.
- quantity: the NUMBER OF PACKAGES ordered, not the units per package. "2 Bud Light 24pk" → quantity: 2.
${COMMON_RULES}`

const FOOD_PROMPT = `You are an expert at reading purchase receipts and invoices for a bar or restaurant — specifically for FOOD and kitchen ingredient orders.

Extract all purchase information from this document and return ONLY a valid JSON object (no markdown fences, no explanation text).

Required JSON shape:
${JSON_SHAPE.replace('"unit_type": "see rules below"', '"unit_type": "lb | oz | kg | each | case | box | bag | gallon | quart | flat | bunch | dozen or null"')}

Rules:
- Only include actual food product line items (proteins, produce, dairy, dry goods, frozen items, sauces, condiments, etc.).
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- unit_type rules:
  - Weight items (chicken, beef, seafood, cheese, etc.): "lb" for pounds, "oz" for ounces, "kg" for kilograms.
  - Produce sold by count or bunch: "each" for individual pieces, "bunch" for bundles, "flat" for flats of produce.
  - Liquid products (oils, sauces, syrups): "gallon" or "quart".
  - Packaged/portioned items: "each" for individual portions, "dozen" for eggs, "box" or "bag" for packaged goods.
  - Bulk case purchases: "case".
  - Leave null if the unit is unclear or not listed.
- package_type and units_per_package: set to null for all food items.
- quantity: the number ordered (e.g. "5 lb chicken breast" → quantity: 5, unit_type: "lb").
${COMMON_RULES}`

const SUPPLIES_PROMPT = `You are an expert at reading purchase receipts and invoices for a bar or restaurant — specifically for PAPER GOODS and SUPPLY orders (napkins, cups, straws, cleaning products, smallwares, packaging, etc.).

Extract all purchase information from this document and return ONLY a valid JSON object (no markdown fences, no explanation text).

Required JSON shape:
${JSON_SHAPE.replace('"unit_type": "see rules below"', '"unit_type": "each | case | box | roll | pack | sleeve | carton or null"')}

Rules:
- Only include actual supply line items (paper goods, disposables, cleaning products, smallwares, packaging, equipment, etc.).
- Skip fees, taxes, deposits, delivery charges, and subtotals/totals.
- unit_type rules:
  - Individual items (a specific tool, container, or product): "each".
  - Bulk case or carton purchases: "case" or "carton".
  - Paper rolls (receipt paper, paper towels, etc.): "roll".
  - Boxes of packaged items: "box".
  - Packs or sleeves of disposables: "pack" or "sleeve".
  - Leave null if the unit is unclear.
- package_type and units_per_package: set to null for all supply items.
- quantity: the number ordered as shown in the QTY column.
${COMMON_RULES}`

function getPrompt(scanType: ScanType): string {
  if (scanType === 'food') return FOOD_PROMPT
  if (scanType === 'supplies') return SUPPLIES_PROMPT
  return LIQUOR_PROMPT
}

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

        // Clamp AI-returned values to sane ranges before using them
        if (unitsPerPackage !== null && (unitsPerPackage <= 0 || unitsPerPackage > 500)) {
          unitsPerPackage = null
        }
        const rawQuantity = item.quantity ?? null
        const safeQuantity = rawQuantity !== null && rawQuantity >= 0 ? rawQuantity : null

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
          quantity: safeQuantity,
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
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  scanType: ScanType = 'liquor'
): Promise<ParsedPurchaseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
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
          { type: 'text', text: getPrompt(scanType) },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}

export async function extractFromPdf(
  pdfBuffer: Buffer,
  scanType: ScanType = 'liquor'
): Promise<ParsedPurchaseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
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
          { type: 'text', text: getPrompt(scanType) },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}
