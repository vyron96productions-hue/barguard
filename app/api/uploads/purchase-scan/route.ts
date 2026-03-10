import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { extractFromImage, extractFromPdf } from '@/lib/document-extraction'
import { resolveInventoryItemId } from '@/lib/aliases'

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

    let parsed
    try {
      if (mimeType === 'application/pdf') {
        parsed = await extractFromPdf(buffer)
      } else {
        parsed = await extractFromImage(buffer, mimeType as 'image/jpeg' | 'image/png' | 'image/webp')
      }
    } catch (claudeErr) {
      console.error('[purchase-scan] Claude extraction failed:', claudeErr)
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
      console.error('[purchase-scan] document_uploads insert failed:', docError)
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
      console.error('[purchase-scan] purchase_import_drafts insert failed:', draftError)
      return NextResponse.json({ error: `DB error (purchase_import_drafts): ${draftError.message}` }, { status: 500 })
    }

    const draftLines = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.line_items.map(async (item: any, idx: number) => {
        const inventoryItemId = await resolveInventoryItemId(item.raw_item_name, supabase, businessId)
        return {
          draft_id: draft.id,
          raw_item_name: item.raw_item_name,
          inventory_item_id: inventoryItemId,
          quantity: item.quantity,
          unit_type: item.unit_type,
          unit_cost: item.unit_cost,
          line_total: item.line_total,
          match_status: inventoryItemId ? 'matched' : 'unmatched',
          confidence: item.confidence,
          is_approved: true,
          sort_order: idx,
          package_type: item.package_type ?? null,
          units_per_package: item.units_per_package ?? null,
        }
      })
    )

    if (draftLines.length > 0) {
      const { error: linesError } = await supabase
        .from('purchase_import_draft_lines')
        .insert(draftLines)
      if (linesError) {
        console.error('[purchase-scan] purchase_import_draft_lines insert failed:', linesError)
        return NextResponse.json({ error: `DB error (draft_lines): ${linesError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      draft_id: draft.id,
      confidence: parsed.overall_confidence,
      warning_message: parsed.warning_message,
      line_count: draftLines.length,
    })
  } catch (err: unknown) {
    return authErrorResponse(err)
  }
}
