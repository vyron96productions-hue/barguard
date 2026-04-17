import { NextResponse } from 'next/server'
import { getCloverAuthUrl } from '@/lib/pos/clover'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
    const redirectUri = `${baseUrl}/api/pos/clover/callback`

    const { businessId } = await getAuthContext()

    // Encode businessId in state so the callback doesn't need the session at all
    const nonce = crypto.randomUUID()
    const state = `${nonce}|${businessId}`

    const response = NextResponse.redirect(getCloverAuthUrl(state, redirectUri))
    response.cookies.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax', secure: true })
    return response
  } catch (e) { return authErrorResponse(e) }
}
