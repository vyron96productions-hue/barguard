import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { extractExpenseFromImage, extractExpenseFromPdf } from '@/lib/expense-extraction'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'uploads/expense-scan'

export const maxDuration = 60

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
type SupportedMimeType = (typeof SUPPORTED_TYPES)[number]

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    const mimeType = file.type as SupportedMimeType
    if (!SUPPORTED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a JPG, PNG, or PDF.' },
        { status: 400 }
      )
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    logger.info(ROUTE, 'Scanning expense document', { businessId, filename: file.name, mimeType, size_kb: Math.round(file.size / 1024) })

    let parsed
    try {
      if (mimeType === 'application/pdf') {
        parsed = await extractExpenseFromPdf(buffer)
      } else {
        parsed = await extractExpenseFromImage(buffer, mimeType as 'image/jpeg' | 'image/png' | 'image/webp')
      }
      logger.info(ROUTE, 'AI extraction complete', { businessId, line_items: parsed.line_items?.length ?? 0, confidence: parsed.overall_confidence, vendor: parsed.vendor_name, total: parsed.total_amount })
    } catch (claudeErr) {
      logError(ROUTE, claudeErr, { businessId, filename: file.name })
      return NextResponse.json(
        { error: `AI extraction failed: ${claudeErr instanceof Error ? claudeErr.message : String(claudeErr)}` },
        { status: 500 }
      )
    }

    // Store the file
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
      return NextResponse.json({ error: `DB error: ${docError.message}` }, { status: 500 })
    }

    // Create the expense draft
    const { data: draft, error: draftError } = await supabase
      .from('expense_import_drafts')
      .insert({
        business_id:        businessId,
        document_upload_id: docUpload.id,
        vendor_name:        parsed.vendor_name,
        receipt_date:       parsed.receipt_date,
        subtotal:           parsed.subtotal,
        tax_amount:         parsed.tax_amount,
        total_amount:       parsed.total_amount,
        payment_method:     parsed.payment_method,
        status:             'pending',
        confidence:         parsed.overall_confidence,
        warning_message:    parsed.warning_message,
      })
      .select()
      .single()

    if (draftError) {
      logger.error(ROUTE, 'expense_import_drafts insert failed', { businessId, error: draftError.message })
      return NextResponse.json({ error: `DB error: ${draftError.message}` }, { status: 500 })
    }

    // Resolve category IDs for suggested categories
    const { data: categories } = await supabase
      .from('expense_categories')
      .select('id, name')
      .or('business_id.is.null,business_id.eq.' + businessId)

    const catByName = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]))

    // Check vendor hints for this vendor
    let vendorHintCategoryId: string | null = null
    if (parsed.vendor_name) {
      const { data: hint } = await supabase
        .from('expense_vendor_hints')
        .select('expense_category_id')
        .eq('business_id', businessId)
        .eq('vendor_name', parsed.vendor_name.toLowerCase().trim())
        .maybeSingle()
      vendorHintCategoryId = hint?.expense_category_id ?? null
    }

    const draftLines = parsed.line_items.map((item, idx) => {
      const suggestedId = item.suggested_category
        ? (catByName.get(item.suggested_category.toLowerCase()) ?? null)
        : null
      return {
        draft_id:            draft.id,
        business_id:         businessId,
        raw_item_name:       item.raw_item_name,
        quantity:            item.quantity,
        unit_price:          item.unit_price,
        line_total:          item.line_total,
        expense_category_id: suggestedId ?? vendorHintCategoryId,
        confidence:          item.confidence,
        sort_order:          idx,
      }
    })

    if (draftLines.length > 0) {
      const { error: linesError } = await supabase
        .from('expense_import_draft_lines')
        .insert(draftLines)
      if (linesError) {
        logger.error(ROUTE, 'draft_lines insert failed', { businessId, error: linesError.message })
        return NextResponse.json({ error: `DB error (lines): ${linesError.message}` }, { status: 500 })
      }
    }

    logger.info(ROUTE, 'Scan complete — draft created', { businessId, draft_id: draft.id, line_count: draftLines.length, total: parsed.total_amount })
    return NextResponse.json({
      draft_id:        draft.id,
      confidence:      parsed.overall_confidence,
      warning_message: parsed.warning_message,
      line_count:      draftLines.length,
      total_amount:    parsed.total_amount,
    })
  } catch (err) {
    logError(ROUTE, err)
    return authErrorResponse(err, ROUTE)
  }
}
