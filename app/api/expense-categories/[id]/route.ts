import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await params
    const body = await req.json()

    const name = String(body.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    // Only allow renaming non-system categories owned by this business
    const { data, error } = await supabase
      .from('expense_categories')
      .update({ name, parent_group: body.parent_group ?? null })
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('is_system', false)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Category not found or cannot be modified' }, { status: 404 })

    return NextResponse.json(data)
  } catch (e) {
    return authErrorResponse(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')
    const { supabase, businessId } = ctx
    const { id } = await params

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('is_system', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
