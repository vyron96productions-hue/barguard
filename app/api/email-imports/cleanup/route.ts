/**
 * Cron route: draft expiration and attachment cleanup
 * Schedule: daily at 03:15 UTC (see vercel.json)
 * Protected by Vercel CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { runCleanup } from '@/lib/email-ingest/cleanup'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // CRON_SECRET check must be first — before any other logic
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCleanup(adminSupabase)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 200 })
  }
}
