import { NextResponse } from 'next/server'
import { connectToast } from '@/lib/pos/toast'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

// Toast uses client_credentials — no OAuth redirect.
// The user POSTs their credentials directly.
export async function POST(req: Request) {
  try {
    const { supabase, businessId } = await getAuthContext()
    const { clientId, clientSecret, restaurantGuid } = await req.json()
    if (!clientId || !clientSecret || !restaurantGuid) {
      return NextResponse.json({ error: 'clientId, clientSecret, and restaurantGuid are required' }, { status: 400 })
    }

    const token = await connectToast(clientId, clientSecret, restaurantGuid)

    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null

    await supabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'toast',
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      token_expires_at: expiresAt,
      merchant_id: clientId,
      client_secret: clientSecret,
      location_id: restaurantGuid,
      location_name: token.location_name ?? restaurantGuid,
      is_active: true,
    }, { onConflict: 'business_id,pos_type' })

    return NextResponse.json({ ok: true, location_name: token.location_name })
  } catch (e) { return authErrorResponse(e) }
}
