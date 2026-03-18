import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { connectHeartland } from '@/lib/pos/heartland'

// Heartland uses a per-location API key — no OAuth redirect needed.
// Customer generates it from: POS Back-Office → Main Menu → Integrations
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { subdomain, apiKey } = await req.json()

    if (!subdomain || !apiKey) {
      return NextResponse.json(
        { error: 'subdomain and apiKey are required' },
        { status: 400 }
      )
    }

    const clean = subdomain.trim().toLowerCase().replace(/\.retail\.heartland\.us.*$/, '')
    const { location_name } = await connectHeartland(clean, apiKey)

    await supabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'heartland',
      access_token: apiKey,
      refresh_token: null,
      token_expires_at: null,
      merchant_id: clean,
      location_id: clean,
      location_name,
      is_active: true,
    }, { onConflict: 'business_id,pos_type' })

    return NextResponse.json({ ok: true, location_name })
  } catch (e) {
    return authErrorResponse(e)
  }
}
