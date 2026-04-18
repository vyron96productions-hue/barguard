import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCloverCode } from '@/lib/pos/clover'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger, logError } from '@/lib/logger'

const ROUTE = 'pos/clover/callback'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code       = url.searchParams.get('code')
  const state      = url.searchParams.get('state')
  const merchantId = url.searchParams.get('merchant_id') ?? ''
  const error      = url.searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin

  if (error) return NextResponse.redirect(`${baseUrl}/connections?error=clover_denied`)
  if (!code || !state) return NextResponse.redirect(`${baseUrl}/connections?error=clover_no_code`)

  const cookieStore = await cookies()
  const savedState = cookieStore.get('pos_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}/connections?error=clover_state_mismatch`)
  }
  cookieStore.delete('pos_oauth_state')

  // businessId is encoded in the state: "{nonce}|{businessId}"
  const businessId = state.split('|')[1]
  if (!businessId) {
    return NextResponse.redirect(`${baseUrl}/connections?error=clover_invalid_state`)
  }

  logger.info(ROUTE, 'Received', { merchantId, hasCode: !!code, hasState: !!state })

  try {
    const redirectUri = `${baseUrl}/api/pos/clover/callback`
    const token = await exchangeCloverCode(code, merchantId, redirectUri)
    logger.info(ROUTE, 'Token exchange ok', { merchantId, locationName: token.location_name })

    const { error: upsertError } = await adminSupabase.from('pos_connections').upsert({
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

    if (upsertError) {
      logger.error(ROUTE, 'DB upsert failed', { error: upsertError.message })
      return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(upsertError.message)}`)
    }

    logger.info(ROUTE, 'Connection saved', { businessId, merchantId })
    return NextResponse.redirect(`${baseUrl}/connections?success=clover`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    logError(ROUTE, e)
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(msg)}`)
  }
}
