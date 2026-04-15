import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// Prefixes that indicate a flat sale line item is really a modifier/add-on
const MODIFIER_PREFIXES = [
  'extra ', 'no ', 'add ', 'sub ', 'without ', 'with ', 'light ', 'heavy ',
  'double ', 'triple ', 'half ', 'side ', 'on the side',
]

function looksLikeModifier(name: string): boolean {
  const lower = name.toLowerCase().trim()
  return MODIFIER_PREFIXES.some((p) => lower.startsWith(p))
}

// GET — return all rules + all unique modifier names seen in sales_transactions
export async function GET() {
  try {
    const { supabase, businessId } = await getAuthContext()

    const [rulesResult, nestedResult, rawResult] = await Promise.all([
      supabase
        .from('modifier_rules')
        .select('id, modifier_name, action, inventory_item_id, qty_delta, qty_unit, multiply_factor, notes')
        .eq('business_id', businessId)
        .order('modifier_name'),
      // Nested modifiers (Square-style, and Toast after the fix)
      supabase
        .from('sales_transactions')
        .select('modifiers')
        .eq('business_id', businessId)
        .not('modifiers', 'is', null),
      // Flat line items that look like add-ons (Toast sends some modifiers this way)
      supabase
        .from('sales_transactions')
        .select('raw_item_name')
        .eq('business_id', businessId),
    ])

    const seen = new Set<string>()

    // From nested modifiers array
    for (const row of nestedResult.data ?? []) {
      if (Array.isArray(row.modifiers)) {
        for (const m of row.modifiers) {
          if (typeof m === 'string' && m.trim()) seen.add(m.trim())
        }
      }
    }

    // From flat raw_item_name values that look like modifier add-ons
    for (const row of rawResult.data ?? []) {
      if (typeof row.raw_item_name === 'string' && looksLikeModifier(row.raw_item_name)) {
        seen.add(row.raw_item_name.trim())
      }
    }

    return NextResponse.json({
      rules: rulesResult.data ?? [],
      seenModifiers: Array.from(seen).sort(),
    })
  } catch (e) { return authErrorResponse(e) }
}

// PUT — upsert a single modifier rule
export async function PUT(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const body = await req.json()
    const { modifier_name, action, inventory_item_id, qty_delta, qty_unit, multiply_factor, notes } = body

    if (!modifier_name || !action) {
      return NextResponse.json({ error: 'modifier_name and action are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('modifier_rules')
      .upsert(
        {
          business_id: businessId,
          modifier_name: modifier_name.trim(),
          action,
          inventory_item_id: inventory_item_id ?? null,
          qty_delta: qty_delta ?? null,
          qty_unit: qty_unit ?? null,
          multiply_factor: multiply_factor ?? null,
          notes: notes ?? null,
        },
        { onConflict: 'business_id,modifier_name' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) { return authErrorResponse(e) }
}

// DELETE — remove a modifier rule by id
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { id } = await req.json()

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('modifier_rules')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) { return authErrorResponse(e) }
}
