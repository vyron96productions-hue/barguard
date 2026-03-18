import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { connectFocus } from '@/lib/pos/focus'

export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { venueKey, apiKey, apiSecret } = await req.json()

    if (!venueKey || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'venueKey, apiKey, and apiSecret are required' },
        { status: 400 }
      )
    }

    const clean = String(venueKey).trim()
    const { location_name } = await connectFocus(clean, apiKey, apiSecret)

    // Store apiKey:apiSecret as access_token (colon-separated for retrieval)
    await supabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'focus',
      access_token: apiKey,
      refresh_token: apiSecret,
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
