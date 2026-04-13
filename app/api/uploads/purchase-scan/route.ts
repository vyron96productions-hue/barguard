import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { extractFromImage, extractFromPdf } from '@/lib/document-extraction'
import { resolveInventoryItemId } from '@/lib/aliases'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'uploads/purchase-scan'

export const maxDuration = 60

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
type SupportedMimeType = (typeof SUPPORTED_TYPES)[number]

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const mimeType = file.type as SupportedMimeType
    if (!SUPPORTED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a JPG, PNG, or PDF.' },
        { status: 400 }
      )
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    logger.info(ROUTE, 'Scanning document', { businessId, filename: file.name, mimeType, size_kb: Math.round(file.size / 1024) })

    let parsed
    try {
      if (mimeType === 'application/pdf') {
        parsed = await extractFromPdf(buffer)
      } else {
        parsed = await extractFromImage(buffer, mimeType as 'image/jpeg' | 'image/png' | 'image/webp')
      }
      logger.info(ROUTE, 'AI extraction complete', { businessId, line_items: parsed.line_items?.length ?? 0, confidence: parsed.overall_confidence, vendor: parsed.vendor_name })
    } catch (claudeErr) {
      logError(ROUTE, claudeErr, { businessId, filename: file.name })
      return NextResponse.json({ error: `AI extraction failed: ${claudeErr instanceof Error ? claudeErr.message : String(claudeErr)}` }, { status: 500 })
    }

    const { data: docUpload, error: docError } = await supabase
      .from('document_uploads')
      .insert({
        business_id: businessId,
        filename: file.name,
        file_type: mimeType,
        file_data: base64,
        raw_extracted_text: parsed.raw_text,
      })
      .select()
      .single()

    if (docError) {
      logger.error(ROUTE, 'document_uploads insert failed', { businessId, error: docError.message })
      return NextResponse.json({ error: `DB error (document_uploads): ${docError.message}` }, { status: 500 })
    }

    const { data: draft, error: draftError } = await supabase
      .from('purchase_import_drafts')
      .insert({
        business_id: businessId,
        document_upload_id: docUpload.id,
        vendor_name: parsed.vendor_name,
        purchase_date: parsed.purchase_date,
        status: 'pending',
        confidence: parsed.overall_confidence,
        warning_message: parsed.warning_message,
      })
      .select()
      .single()

    if (draftError) {
      logger.error(ROUTE, 'purchase_import_drafts insert failed', { businessId, error: draftError.message })
      return NextResponse.json({ error: `DB error (purchase_import_drafts): ${draftError.message}` }, { status: 500 })
    }

    const draftLines = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.line_items.map(async (item: any, idx: number) => {
        const name = typeof item.raw_item_name === 'string' ? item.raw_item_name.trim() : ''
        const inventoryItemId = name ? await resolveInventoryItemId(name, supabase, businessId) : null
        return {
          draft_id: draft.id,
          raw_item_name: name || `Line ${idx + 1}`,
          inventory_item_id: inventoryItemId,
          quantity: typeof item.quantity === 'number' ? item.quantity : null,
          unit_type: item.unit_type ?? null,
          unit_cost: typeof item.unit_cost === 'number' ? item.unit_cost : null,
          line_total: typeof item.line_total === 'number' ? item.line_total : null,
          match_status: inventoryItemId ? 'matched' : 'unmatched',
          confidence: item.confidence ?? 'low',
          is_approved: true,
          sort_order: idx,
          package_type: item.package_type ?? null,
          units_per_package: item.units_per_package ?? null,
        }
      })
    )

    // Try batch insert first; fall back to per-line so one bad row never kills the whole scan
    let insertedCount = 0
    if (draftLines.length > 0) {
      const { error: batchError } = await supabase
        .from('purchase_import_draft_lines')
        .insert(draftLines)

      if (batchError) {
        logger.warn(ROUTE, 'Batch line insert failed — falling back to per-line', { businessId, error: batchError.message })
        for (const line of draftLines) {
          const { error: lineErr } = await supabase.from('purchase_import_draft_lines').insert(line)
          if (lineErr) {
            logger.warn(ROUTE, 'Skipping invalid draft line', { error: lineErr.message, raw_item_name: line.raw_item_name })
          } else {
            insertedCount++
          }
        }
      } else {
        insertedCount = draftLines.length
      }
    }

    logger.info(ROUTE, 'Scan complete — draft created', { businessId, draft_id: draft.id, line_count: insertedCount })
    return NextResponse.json({
      draft_id: draft.id,
      confidence: parsed.overall_confidence,
      warning_message: parsed.warning_message,
      line_count: insertedCount,
    })
  } catch (err: unknown) {
    logError(ROUTE, err)
    return authErrorResponse(err, ROUTE)
  }
}
