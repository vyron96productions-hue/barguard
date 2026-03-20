import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// POST /api/sales/resolve-aliases
// Save manual alias matches + backfill existing sales_transactions that have menu_item_id = null
export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { resolutions } = await req.json() as {
      resolutions: Array<{ raw_name: string; menu_item_id: string }>
    }

    if (!Array.isArray(resolutions) || resolutions.length === 0) {
      return NextResponse.json({ error: 'resolutions array required' }, { status: 400 })
    }

    // 1. Upsert aliases so future uploads auto-match
    const { error: aliasError } = await supabase
      .from('menu_item_aliases')
      .upsert(
        resolutions.map(({ raw_name, menu_item_id }) => ({
          business_id: businessId,
          raw_name,
          menu_item_id,
        })),
        { onConflict: 'business_id,raw_name' }
      )

    if (aliasError) return NextResponse.json({ error: aliasError.message }, { status: 500 })

    // 2. Backfill existing transactions that are still unmatched for these raw names
    let totalBackfilled = 0
    for (const { raw_name, menu_item_id } of resolutions) {
      await supabase
        .from('sales_transactions')
        .update({ menu_item_id })
        .eq('business_id', businessId)
        .eq('raw_item_name', raw_name)
        .is('menu_item_id', null)

      totalBackfilled++
    }

    return NextResponse.json({ resolved: resolutions.length, backfilled: totalBackfilled })
  } catch (e) {
    return authErrorResponse(e)
  }
}
