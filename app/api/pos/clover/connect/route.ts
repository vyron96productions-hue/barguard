import { NextResponse } from 'next/server'
import { getCloverAuthUrl } from '@/lib/pos/clover'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin

    // Guard: fail fast with a visible error rather than sending the user to a
    // broken Clover OAuth page (which shows an Ember crash with no explanation).
    if (!process.env.CLOVER_CLIENT_ID) {
      console.error('[clover/connect] CLOVER_CLIENT_ID env var is not set')
      return NextResponse.redirect(`${baseUrl}/connections?error=clover_not_configured`)
    }

    const redirectUri = `${baseUrl}/api/pos/clover/callback`

    const { businessId } = await getAuthContext()

    const nonce = crypto.randomUUID()
    const state = `${nonce}|${businessId}`

    console.log('[clover/connect] initiating OAuth', {
      env: process.env.CLOVER_ENVIRONMENT ?? 'sandbox',
      redirectUri,
      businessId,
    })

    const response = NextResponse.redirect(getCloverAuthUrl(state, redirectUri))
    response.cookies.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax', secure: true })
    return response
  } catch (e) { return authErrorResponse(e) }
}
