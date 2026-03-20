import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeSquareCode } from '@/lib/pos/square'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin

  if (error) return NextResponse.redirect(`${baseUrl}/connections?error=square_denied`)
  if (!code) return NextResponse.redirect(`${baseUrl}/connections?error=square_no_code`)

  const cookieStore = await cookies()
  const savedState = cookieStore.get('pos_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/connections?error=square_state_mismatch`)
  }
  cookieStore.delete('pos_oauth_state')

  // Read business_id from cookie — session cookie won't survive the cross-site redirect from Square
  const businessId = cookieStore.get('pos_oauth_business_id')?.value
  cookieStore.delete('pos_oauth_business_id')
  if (!businessId) {
    return NextResponse.redirect(`${baseUrl}/connections?error=square_session_expired`)
  }

  try {
    const redirectUri = `${baseUrl}/api/pos/square/callback`
    const token = await exchangeSquareCode(code, redirectUri)

    await adminSupabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'square',
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      token_expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      merchant_id: token.merchant_id ?? null,
      location_id: token.location_id ?? null,
      location_name: token.location_name ?? null,
      is_active: true,
    }, { onConflict: 'business_id,pos_type' })

    return NextResponse.redirect(`${baseUrl}/connections?success=square`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(msg)}`)
  }
}
