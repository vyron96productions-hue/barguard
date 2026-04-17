import { NextResponse } from 'next/server'
import { getLightspeedAuthUrl } from '@/lib/pos/lightspeed'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(req: Request) {
  try {
    // Verify the user is authenticated before initiating OAuth
    await getAuthContext()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
    const state = crypto.randomUUID()
    const redirectUri = `${baseUrl}/api/pos/lightspeed/callback`

    const cookieStore = await cookies()
    cookieStore.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })

    return NextResponse.redirect(getLightspeedAuthUrl(state, redirectUri))
  } catch (e) { return authErrorResponse(e) }
}
