import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function checkSupabase(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await supabase.from('businesses').select('id').limit(1)
    return { ok: !error, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

async function checkStripe(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

async function checkAnthropic(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()
  try {
    const res = await fetch('https://status.anthropic.com/api/v2/status.json', {
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    const ok = data?.status?.indicator === 'none' || data?.status?.indicator === 'minor'
    return { ok, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

async function checkResend(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now()
  try {
    const res = await fetch('https://resend-status.com/api/v2/status.json', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { ok: false, latency: Date.now() - start }
    const data = await res.json()
    const ok = data?.status?.indicator === 'none' || data?.status?.indicator === 'minor'
    return { ok, latency: Date.now() - start }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

export async function GET() {
  const [db, payments, ai, email] = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkAnthropic(),
    checkResend(),
  ])

  const services = [
    { name: 'Application', key: 'app', ok: true, latency: 0 },
    { name: 'Database', key: 'database', ...db },
    { name: 'Payments', key: 'payments', ...payments },
    { name: 'AI Features', key: 'ai', ...ai },
    { name: 'Email', key: 'email', ...email },
  ]

  const allOk = services.every((s) => s.ok)

  return NextResponse.json({
    status: allOk ? 'operational' : 'degraded',
    services,
    checkedAt: new Date().toISOString(),
  })
}
