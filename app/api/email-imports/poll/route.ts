/**
 * Cron route: Gmail inbox poll
 * Schedule: every 15 minutes (see vercel.json)
 * Protected by Vercel CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { runPoll } from '@/lib/email-ingest/poll'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // CRON_SECRET check must be first — before any other logic
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startMs = Date.now()

  try {
    const result = await runPoll()
    const duration = Date.now() - startMs

    // Log the run for observability
    await adminSupabase.from('email_poll_log').insert({
      messages_found: result.messagesFound,
      drafts_created: result.draftsCreated,
      duration_ms:    duration,
      errors:         result.errors.length > 0 ? result.errors : null,
    })

    return NextResponse.json({
      ok:             true,
      messages_found: result.messagesFound,
      drafts_created: result.draftsCreated,
      duration_ms:    duration,
      errors:         result.errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const duration = Date.now() - startMs

    // Log even failed runs so silence is observable — never throw from logging
    try {
      await adminSupabase.from('email_poll_log').insert({
        messages_found: 0,
        drafts_created: 0,
        duration_ms:    duration,
        errors:         [message],
      })
    } catch {}

    return NextResponse.json({ ok: false, error: message }, { status: 200 })
    // Return 200 so Vercel doesn't treat it as a cron failure and stop retrying
  }
}
