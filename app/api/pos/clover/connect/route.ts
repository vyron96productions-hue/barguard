import { NextResponse } from 'next/server'
import { getCloverAuthUrl } from '@/lib/pos/clover'
import { getAuthContext } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
  const state = crypto.randomUUID()
  const redirectUri = `${baseUrl}/api/pos/clover/callback`

  // Grab business_id before leaving — session cookie won't survive the cross-site redirect back
  const { businessId } = await getAuthContext()

  const response = NextResponse.redirect(getCloverAuthUrl(state, redirectUri))
  response.cookies.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' })
  response.cookies.set('pos_oauth_business_id', businessId, { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' })
  return response
}
