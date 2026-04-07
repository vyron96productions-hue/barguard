/**
 * POST /api/email-imports/[id]/cancel
 * Cancel a pending sales import draft.
 * Sets status to cancelled; no production data is written or deleted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await params

    // Load draft with explicit businessId check
    const { data: draft, error: draftErr } = await supabase
      .from('sales_import_drafts')
      .select('id, status')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'pending_review') {
      return NextResponse.json(
        { error: `Draft cannot be cancelled — current status: ${draft.status}` },
        { status: 409 }
      )
    }

    const { error: updateErr } = await supabase
      .from('sales_import_drafts')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
