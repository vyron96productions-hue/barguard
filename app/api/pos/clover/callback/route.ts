import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCloverCode } from '@/lib/pos/clover'
import { supabase, DEMO_BUSINESS_ID } from '@/lib/db'

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

  try {
    const token = await exchangeCloverCode(code, merchantId)

    await supabase.from('pos_connections').upsert({
      business_id: DEMO_BUSINESS_ID,
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
  } catch (e: any) {
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(e.message)}`)
  }
}
