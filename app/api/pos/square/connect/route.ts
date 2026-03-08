import { NextResponse } from 'next/server'
import { getSquareAuthUrl } from '@/lib/pos/square'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
  const state = crypto.randomUUID()
  const redirectUri = `${baseUrl}/api/pos/square/callback`

  const cookieStore = await cookies()
  cookieStore.set('pos_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })

  return NextResponse.redirect(getSquareAuthUrl(state, redirectUri))
}
