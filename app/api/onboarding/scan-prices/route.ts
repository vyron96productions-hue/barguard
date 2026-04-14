import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { extractFromImage, extractFromPdf } from '@/lib/document-extraction'
import { logError } from '@/lib/logger'
import type { ScanType } from '@/lib/document-extraction'

const ROUTE = 'onboarding/scan-prices'

export async function POST(req: NextRequest) {
  try {
    await getAuthContext() // auth check only — no DB writes

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const scanType = (formData.get('scan_type') as ScanType | null) ?? 'liquor'

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const MAX_FILE_BYTES = 20_000_000 // 20 MB
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
    type AllowedMime = typeof ALLOWED_MIME[number]
    const rawMime = file.type || 'image/jpeg'
    const mimeType: AllowedMime = (ALLOWED_MIME as readonly string[]).includes(rawMime)
      ? (rawMime as AllowedMime)
      : 'image/jpeg'

    const result = isPdf
      ? await extractFromPdf(buffer, scanType)
      : await extractFromImage(buffer, mimeType, scanType)

    // Return only what we need for price-setting (no quantities, no dates)
    const items = result.line_items
      .filter((l) => l.raw_item_name && l.unit_cost != null && l.unit_cost > 0)
      .map((l) => ({
        raw_item_name: l.raw_item_name,
        unit_cost: l.unit_cost,
        unit_type: l.unit_type,
        units_per_package: l.units_per_package,
        confidence: l.confidence,
      }))

    return NextResponse.json({
      items,
      vendor_name: result.vendor_name,
      warning_message: result.warning_message,
    })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
