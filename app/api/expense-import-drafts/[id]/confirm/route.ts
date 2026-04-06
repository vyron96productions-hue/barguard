import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

interface ConfirmLine {
  id: string
  raw_item_name: string
  quantity: number | null
  unit_price: number | null
  line_total: number | null
  expense_category_id: string | null
  notes: string | null
}

interface ConfirmBody {
  vendor_name: string | null
  receipt_date: string | null
  subtotal: number | null
  tax_amount: number | null
  total_amount: number
  payment_method: string | null
  notes: string | null
  lines: ConfirmLine[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user, businessId } = await getAuthContext()
    const { id } = await params
    const body: ConfirmBody = await req.json()

    if (!body.total_amount || body.total_amount <= 0) {
      return NextResponse.json({ error: 'total_amount is required' }, { status: 400 })
    }

    const receiptDate = body.receipt_date ?? new Date().toISOString().slice(0, 10)

    // Atomic status claim — only one request can win
    const { data: draft, error: claimError } = await supabase
      .from('expense_import_drafts')
      .update({
        status:       'confirmed',
        vendor_name:  body.vendor_name,
        receipt_date: receiptDate,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .select('id, document_upload_id')
      .maybeSingle()

    if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 })
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft has already been confirmed or cancelled' },
        { status: 409 }
      )
    }

    // Create the confirmed expense receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('expense_receipts')
      .insert({
        business_id:        businessId,
        document_upload_id: draft.document_upload_id,
        vendor_name:        body.vendor_name,
        receipt_date:       receiptDate,
        subtotal:           body.subtotal,
        tax_amount:         body.tax_amount,
        total_amount:       body.total_amount,
        payment_method:     body.payment_method,
        notes:              body.notes,
        created_by:         user.id,
      })
      .select()
      .single()

    if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

    // Insert line items
    const validLines = body.lines.filter((l) => l.raw_item_name?.trim())
    if (validLines.length > 0) {
      const items = validLines.map((l) => ({
        receipt_id:          receipt.id,
        business_id:         businessId,
        raw_item_name:       l.raw_item_name,
        quantity:            l.quantity,
        unit_price:          l.unit_price,
        line_total:          l.line_total,
        expense_category_id: l.expense_category_id,
        notes:               l.notes,
      }))
      const { error: itemsError } = await supabase.from('expense_receipt_items').insert(items)
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Update vendor hint — remember which category this vendor maps to
    if (body.vendor_name && validLines.length > 0) {
      // Find the most-used category in this receipt's lines
      const catCounts = new Map<string, number>()
      for (const l of validLines) {
        if (l.expense_category_id) {
          catCounts.set(l.expense_category_id, (catCounts.get(l.expense_category_id) ?? 0) + 1)
        }
      }
      if (catCounts.size > 0) {
        const topCatId = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        const vendorKey = body.vendor_name.toLowerCase().trim()
        await supabase
          .from('expense_vendor_hints')
          .upsert(
            {
              business_id:         businessId,
              vendor_name:         vendorKey,
              expense_category_id: topCatId,
              updated_at:          new Date().toISOString(),
            },
            { onConflict: 'business_id,vendor_name' }
          )
      }
    }

    return NextResponse.json({
      receipt_id:    receipt.id,
      items_saved:   validLines.length,
      total_amount:  receipt.total_amount,
    })
  } catch (err) {
    return authErrorResponse(err)
  }
}
