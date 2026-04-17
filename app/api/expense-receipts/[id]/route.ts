import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await params

    const { data: receipt, error } = await supabase
      .from('expense_receipts')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const { data: items } = await supabase
      .from('expense_receipt_items')
      .select('*, expense_category:expense_categories(id, name, parent_group)')
      .eq('receipt_id', id)
      .order('created_at')

    return NextResponse.json({ ...receipt, items: items ?? [] })
  } catch (e) {
    return authErrorResponse(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'manager')
    const { supabase, businessId } = ctx
    const { id } = await params

    const { error } = await supabase
      .from('expense_receipts')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
