import { NextResponse } from 'next/server'
import { getSquareAuthUrl } from '@/lib/pos/square'
import { getAuthContext } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
  const redirectUri = `${baseUrl}/api/pos/square/callback`

  const { businessId } = await getAuthContext()

  // Encode businessId in state so the callback doesn't need the session at all
  const nonce = crypto.randomUUID()
  const state = `${nonce}|${businessId}`

  const response = NextResponse.redirect(getSquareAuthUrl(state, redirectUri))
  response.cookies.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax', secure: true })
  return response
}
