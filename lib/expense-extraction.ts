import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedExpenseLineItem {
  raw_item_name: string
  quantity: number | null
  unit_price: number | null
  line_total: number | null
  suggested_category: string | null  // maps to expense_categories.name
  confidence: 'high' | 'medium' | 'low'
}

export interface ParsedExpenseDocument {
  vendor_name: string | null
  receipt_date: string | null   // YYYY-MM-DD
  subtotal: number | null
  tax_amount: number | null
  total_amount: number | null
  payment_method: string | null // 'cash' | 'credit' | 'debit' | 'check' | null
  line_items: ParsedExpenseLineItem[]
  raw_text: string
  overall_confidence: 'high' | 'medium' | 'low'
  warning_message: string | null
}

const EXPENSE_EXTRACTION_PROMPT = `You are an expert at reading retail receipts, store receipts, and operating expense invoices for a bar or restaurant business.

This receipt is for NON-INVENTORY business operating expenses — things like office supplies, cleaning products, maintenance items, smallwares, admin supplies, batteries, paper, tools, etc.

Extract all information and return ONLY a valid JSON object (no markdown fences, no explanation text).

Required JSON shape:
{
  "vendor_name": "store or merchant name, or null",
  "receipt_date": "YYYY-MM-DD or null",
  "subtotal": number or null,
  "tax_amount": number or null,
  "total_amount": number or null,
  "payment_method": "cash | credit | debit | check | null",
  "line_items": [
    {
      "raw_item_name": "exact product name as printed",
      "quantity": number or null,
      "unit_price": number or null,
      "line_total": number or null,
      "suggested_category": "one of: Office Supplies | Cleaning Supplies | Maintenance | Repairs | Staff Supplies | Kitchen Supplies | Smallwares | Admin | Marketing | Utilities | Other",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "raw_text": "full verbatim text from the document",
  "overall_confidence": "high" | "medium" | "low",
  "warning_message": "string describing issues, or null if clean"
}

Rules:
- Extract EVERY purchasable line item — do not skip items.
- Do NOT include subtotals, taxes, totals, fees, or loyalty points as line items.
- raw_item_name: use the exact product name as printed on the receipt.
- quantity: the number of units of that item purchased. Often found before or after the product name. Leave null only if truly absent.
- unit_price: the price per single unit. Leave null if not shown.
- line_total: total price for that line (quantity × unit_price). Extract this if shown.
- suggested_category: pick the best match from the allowed list based on the product description:
  - pens, paper, folders, tape, staplers, notebooks → "Office Supplies"
  - mops, bleach, trash bags, cleaning spray, gloves, sponges → "Cleaning Supplies"
  - lightbulbs, tools, hardware, HVAC filters, plumbing parts → "Maintenance"
  - repair parts, replacement components → "Repairs"
  - uniforms, aprons, gloves (non-cleaning) → "Staff Supplies"
  - food prep containers, cutting boards, cooking tools → "Kitchen Supplies"
  - bar tools, shakers, pourers, ice buckets, glasses → "Smallwares"
  - printer ink, postage, envelopes → "Admin"
  - flyers, promo items → "Marketing"
  - propane, electricity top-up, water → "Utilities"
  - anything else → "Other"
- payment_method: detect from receipt footer text ("VISA", "MASTERCARD", "CASH", "DEBIT", "CHECK", etc.). Set null if not visible.
- subtotal: the pre-tax total shown on the receipt. Null if not shown.
- tax_amount: the tax line amount. Null if not shown separately.
- total_amount: the final total charged. This is the most important field — always extract it if visible.
- overall_confidence: "low" if blurry, torn, partial, or hard to read; "high" if clear and complete.
- raw_text: include ALL text visible in the document verbatim.
- Do NOT output anything outside the JSON object.`

function parseResponse(text: string): ParsedExpenseDocument {
  const stripped = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  try {
    const parsed = JSON.parse(stripped)
    return {
      vendor_name:     parsed.vendor_name     ?? null,
      receipt_date:    parsed.receipt_date    ?? null,
      subtotal:        parsed.subtotal        != null ? Number(parsed.subtotal)     : null,
      tax_amount:      parsed.tax_amount      != null ? Number(parsed.tax_amount)   : null,
      total_amount:    parsed.total_amount    != null ? Number(parsed.total_amount) : null,
      payment_method:  parsed.payment_method  ?? null,
      line_items: Array.isArray(parsed.line_items)
        ? parsed.line_items.map((item: ParsedExpenseLineItem) => ({
            raw_item_name:      item.raw_item_name ?? 'Unknown item',
            quantity:           item.quantity    != null ? Number(item.quantity)    : null,
            unit_price:         item.unit_price  != null ? Number(item.unit_price)  : null,
            line_total:         item.line_total  != null ? Number(item.line_total)  : null,
            suggested_category: item.suggested_category ?? null,
            confidence:         item.confidence ?? 'medium',
          }))
        : [],
      raw_text:           parsed.raw_text           ?? stripped,
      overall_confidence: parsed.overall_confidence ?? 'medium',
      warning_message:    parsed.warning_message    ?? null,
    }
  } catch {
    return {
      vendor_name:        null,
      receipt_date:       null,
      subtotal:           null,
      tax_amount:         null,
      total_amount:       null,
      payment_method:     null,
      line_items:         [],
      raw_text:           text,
      overall_confidence: 'low',
      warning_message:    'Could not parse extracted data. Please review the raw text and enter details manually.',
    }
  }
}

export async function extractExpenseFromImage(
  imageBuffer: Buffer,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<ParsedExpenseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBuffer.toString('base64') },
          },
          { type: 'text', text: EXPENSE_EXTRACTION_PROMPT },
        ],
      },
    ],
  })
  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}

export async function extractExpenseFromPdf(pdfBuffer: Buffer): Promise<ParsedExpenseDocument> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBuffer.toString('base64') } } as any,
          { type: 'text', text: EXPENSE_EXTRACTION_PROMPT },
        ],
      },
    ],
  })
  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('Unexpected Claude response type')
  return parseResponse(content.text)
}
