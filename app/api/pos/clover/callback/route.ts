import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCloverCode } from '@/lib/pos/clover'
import { getAuthContext } from '@/lib/auth'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code       = url.searchParams.get('code')
  const state      = url.searchParams.get('state')
  const merchantId = url.searchParams.get('merchant_id') ?? ''
  const error      = url.searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin

  if (error) return NextResponse.redirect(`${baseUrl}/connections?error=clover_denied`)
  if (!code) return NextResponse.redirect(`${baseUrl}/connections?error=clover_no_code`)

  const cookieStore = await cookies()
  const savedState = cookieStore.get('pos_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/connections?error=clover_state_mismatch`)
  }
  cookieStore.delete('pos_oauth_state')

  let businessId: string
  try {
    const ctx = await getAuthContext()
    businessId = ctx.businessId
  } catch {
    return NextResponse.redirect(`${baseUrl}/connections?error=clover_auth_required`)
  }

  try {
    const token = await exchangeCloverCode(code, merchantId)

    await adminSupabase.from('pos_connections').upsert({
      business_id: businessId,
      pos_type: 'clover',
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      token_expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      merchant_id: merchantId,
      location_id: merchantId,
      location_name: token.location_name ?? merchantId,
      is_active: true,
    }, { onConflict: 'business_id,pos_type' })

    return NextResponse.redirect(`${baseUrl}/connections?success=clover`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(msg)}`)
  }
}
