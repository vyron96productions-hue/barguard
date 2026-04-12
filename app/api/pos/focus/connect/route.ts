import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { connectFocus } from '@/lib/pos/focus'

export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { focusDns, storeKey, apiKey, apiSecret } = await req.json()

    if (!focusDns || !storeKey || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'focusDns, storeKey, apiKey, and apiSecret are required' },
        { status: 400 }
      )
    }

    const { location_name } = await connectFocus(
      focusDns.trim(),
      String(storeKey).trim(),
      apiKey.trim(),
      apiSecret
    )

    await supabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'focus',
      access_token: apiKey.trim(),   // API key
      refresh_token: apiSecret,       // API secret
      token_expires_at: null,
      merchant_id: String(storeKey).trim(),  // store key
      location_id: focusDns.trim(),          // DNS subdomain
      location_name,
      is_active: true,
    }, { onConflict: 'business_id,pos_type' })

    return NextResponse.json({ ok: true, location_name })
  } catch (e) {
    return authErrorResponse(e)
  }
}
